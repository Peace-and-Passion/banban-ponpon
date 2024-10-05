/**
  Passkeys Authenticator for Banban Ponpon

  @author Hirano Satoshi
  @copyright 2024 Peace and Passion
  @since 2024/3/15
 */
import browser from 'webextension-polyfill';
import * as conf from '../conf';
declare class _VerifyAuthenticationResponse {
  public at: string;
  public atExp: number;
  public userID: string;
  public land_id: string;
}

interface AuthenticateOptions {
    land_id_or_userID: string;
    checkLoginInProgress?: boolean;
}

export class Passkey {
    accessToken: string|undefined;                  // access token
    accessTokenExpiration: number|undefined;        // expiration UTC time of access token
    userID: string|undefined = undefined;
    orgID: string|undefined  = undefined;
    land_id: string|undefined  = undefined;

    private checkLoginInProgress: boolean|Error = false;   // checkLogin() is in progress
    openerID: string;                     // ID that opened this login page in a tab
    openerID_send: string;                // openerID of sender side
    tabInProgress: boolean = false;       // auth process in another tab in progress
    openProxyDialogPromise: Promise<any>  // promise to open-proxy-dialog

    constructor() {
        this.restoreAccessToken();

        // restore access token if login/logout occures in a tab
        browser.storage.onChanged.addListener(this.restoreAccessToken);
    }

    /**
     * WebAuthn authenticate (login) to get an accessToken. After this method, this.userService.accessToken is valid.
     *
     * This dfoes not handle exception caused by fetch() because, unlike OAuth, we don't need to
     * clear a session cookie.
     *
     * @param daddress Optional D-Address to specify the default D-Address to authenticate.
     * @param authorizeUIMode Specifies where to perform. A new popup window or a new tab, or existing
     * iframe.
     * @iframe Iframe element. Required if authorizeUIMode isAuthorizeUIMode.Iframe.
     * @return A promise if success.
     * @throws Error with "cancel", "forgot_password", "signup"...
     */
    public async authenticate(options: AuthenticateOptions): Promise<string> {
        console.log('authenticate: start');
        return await this.processInAnotherTab(options.land_id_or_userID, false);

        // XXX in-extension passkey authentication was omitted.
    }

    public verifyServerResponseBody(verificationResponse: _VerifyAuthenticationResponse): _VerifyAuthenticationResponse {
        //console.log(funcName + 'OK');

        this.clearLoginState();
        this.saveAccessToken(verificationResponse);
        return verificationResponse;
    }

    /** Authenticate user or register passkey in another tab for Chrome PWA which does not support passkeys */
    public async processInAnotherTab(land_id: string|undefined, register: boolean): Promise<string> {
        return new Promise<string>(async (resolve, _reject) => {
            try {
                await this.processInAnotherTabBody(land_id, register, true);
                resolve(this.accessToken as string);
            } catch (_err: any) {
                const err: Error = _err;
                // ouch! opening a tab blocked because user interaction such as pressing button is required.
                // open a open-proxy-dialog and wait for the user to press the button that calls processInAnotherTabBody().
                if (err.message === "Tab blocked") {
                    this.openProxyDialogPromise = this.showProxyingDialog({ land_id: land_id, showButton: true });

                    // processInAnotherTabBody() closes the dialog after receiving a message from the passkey proxy.
                    this.openProxyDialogPromise.then(() => {
                        resolve(this.accessToken as string);
                    });
                    return;
                }
                throw err;
            }
        });
    }

    showProxyingDialog(param: {land_id: string|undefined, showButton: boolean}): Promise<void> {
        //XXX
        return Promise.resolve();
    }

    showErrorDialog(msg: string) {
        console.log(msg)
    }

    /** Authenticate user or register passkey in another tab for Chrome PWA which does not support passkeys

     @param land_id     A Land ID.
     @param register    True if passkey registration.
     @param openDialog  True to open OpenProxyDialog.
     */
    async processInAnotherTabBody(land_id: string|undefined, register: boolean, openDialog: boolean): Promise<void> {
        let params: URLSearchParams;
        let newTab: Window|null;
        this.openerID_send = randomString(10);

        return new Promise<void>((resolve, _reject) => {
            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== conf.originUri || event.data?.openerID !== this.openerID_send) {
                    return;
                }

                window.removeEventListener("message", handleMessage);

                // close the tab
                try {
                    newTab?.close();
                } catch {}

                if (!this.tabInProgress) return;
                this.tabInProgress = false;

                // set AT and userID if no error
                if (event.data?.msg === 'login end') {
                    // this.verifyServerResponseBody(event.data);
                    console.log('authenticateInAnotherTab: ' + event.data?.value);
                    this.accessToken = event.data?.value;
                    resolve(event.data?.value);
                }

                // close the dialog XXX
                // this.openProxyDialogPromise?.then((openDialogResult) => { openDialogResult.controller.cancel(); });

            };


            // addEventListener before open a tab
            window.addEventListener("message", handleMessage);

            this.tabInProgress = true;

            if (register) {
                params = new URLSearchParams({
                    mode: 'create-passkey',
                    openerID: this.openerID_send,
                    extensionID: conf.webExtID,
                });
                newTab = window.open(conf.originUri + '/create-passkey-view?' + params.toString(), "_blank");
            } else {
                params = new URLSearchParams({ extensionID: conf.webExtID });
                if (land_id) params.set('land_id', land_id);
                newTab = window.open(conf.originUri + '/app-login/' + this.openerID_send + '?' + params.toString(), "_blank");
            }

            if (!newTab) {
                throw new Error("Tab blocked");
            }

            if (openDialog) {
                // no open-proxy-dialog exists. Open one without the button.
                this.openProxyDialogPromise = this.showProxyingDialog({ land_id: land_id, showButton: false });
            }

            newTab.focus();

            // setTimeout(() => {
            //     window.removeEventListener("message", handleMessage);
            //     reject(new Error("Passkey canceled"));
            // }, 10000);
        });
    }

    cancelProcessInAnotherTab() {
        if (this.tabInProgress) {
            // send to this context to close the tab
            window.postMessage({openerID: this.openerID_send, 'error': 'Passkey canceled'}, conf.originUri);
        }
    }

    /**
    Checks validity of the access token. If required refresh or authenticate again to get a new access token.

    This method is reentrant and several threads enter. If a predecessor thread is processing, the
    checkLoginInProgress flag is true. In that case others waits its end with the sleep-while-busy loop.

    If the predecessor expericences an error, the checkLoginInProgress flag keeps the error and it
    has to be propagated to other threads that will throws the error.
     */
    public async checkLogin(): Promise<void> {
        const sleep = (msec: number): Promise<void> => { return new Promise(resolve => setTimeout((resolve), msec)); }
        const timeout = Date.now() + conf.PasskeyCheckLoginTimeout;
        let showMsg = 0;      // show waiting... log msg only once

        try {
            // loop with sleep until timeout
            while (timeout > Date.now()) {
                // during waiting, refreshing access token or loging out may occur
                if (await this.hasValidAccessToken() || !this.userID) {
                    console.log('checkLogin: valid AT or Anon');
                    return;
                }

                // throw if predecessor errors. "showMsg > 0" assures only waiting threads involved
                if (showMsg > 0 && this.checkLoginInProgress instanceof Error) {
                    const err = this.checkLoginInProgress;
                    this.checkLoginInProgress = false;
                    console.log('checkLogin: Waiting end with ' + err);
                    throw err;
                }

                // if (!this.cookies['RT-exp-' + this.userID]) {
                //     // another tab logs out with the userID
                //     console.log('checkLogin: RT-exp disappeared');
                //     // this.userService.logout(false, true);
                //     throw new Error('Login required');
                // }

                // wait and loop
                if (this.checkLoginInProgress == true) {
                    if (showMsg++ === 0) console.log('checkLogin: Waiting..');
                    else console.log('checkLogin: Waiting ' + String(showMsg));
                    await sleep(500);  // loop every 0.5 sec
                    continue;
                }

                if (showMsg > 0) console.log('checkLogin: enter after wait');
                else console.log('checkLogin: enter without wait');

                this.checkLoginInProgress = true;
                console.log('checkLogin: checkLoginInProgress = true');

                //   this.userService.user?.eID tests success of setUserOrg()
                if (this.hasValidRefreshToken()) {
                    // if (this.userService.user?.eID && this.hasValidRefreshToken()) {
                    try {
                        // refreshAccessToken()
                        await this.refreshAccessToken();
                        console.log('checkLogin: refreshAccessToken() done');

                        // if setUserOrg() failed, fetch _UserOrg
                        // if (!this.userService.user?.eID) {
                        //     await this.userService.loginToServer(false);  // fetch User and Org from server
                        //     // this.navigateAfterLogin();
                        // }
                        return;
                    } catch {}   // In case error, fall through to authenticate()
                }

                // authenticate()
                await this.authenticate({
                    land_id_or_userID: this.land_id || this.userID,
                    checkLoginInProgress: true});
                console.log('checkLogin: authenticate() done');

                // if setUserOrg() not yet at startup, fetch _UserOrg
                // if (!this.userService.user?.eID) {
                //     await this.userService.loginToServer(false);  // fetch User and Org from server
                //     this.userService.navigateAfterLogin();
                // }
                return;
            }; // while

            console.log('checkLogin: wait timeout. Passkey canceled');
            throw new Error('Passkey canceled');

        } catch (err) {
            this.checkLoginInProgress = err as Error;

            if (err instanceof conf.NetworkError && await navigator?.serviceWorker?.getRegistration('/')) {
                // network error and serviceworker exists -> AccessToken for offline mode
                console.log('checkLogin: ignore NetworkError. Maybe offline');
                this.checkLoginInProgress = false;
                return;  // ignore error
            }
            if ((err as Error).message !== 'Passkey canceled') console.log('CheckLogin: ' + err);
            throw err;   // rethrow err
        } finally {
            if (this.checkLoginInProgress === true) {
                // Only reset to false if the process was still marked as in progress
                // This prevents overwriting an error that needs to be propagated
                this.checkLoginInProgress = false;
            }
        }
    }

    /**
      Refresh access tokn using the refresh token or session cookie.
        /login/refresh-token
     */
    public async refreshAccessToken(): Promise<void> {
        if (!this.userID || await this.hasValidAccessToken() || !this.hasValidRefreshToken()) return;

        const resp: Response = await fetch(conf.apiURL + '/login/refresh-token', {
            body: JSON.stringify({
                userID: this.userID
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });

        if (!resp.ok) {
            const msg: string = await resp.text();
            console.log('refreshAccessToken: ' + msg);
            throw new Error(msg);
        }

        const verificationResponse: _VerifyAuthenticationResponse = JSON.parse(await resp.text());
        this.saveAccessToken(verificationResponse);
    }

    /**
    Switch user accountwithout a dialog if possible, or open a login dialog.

    If we have a valid access token for the given land_id, just return true.

    @param land_id  A Land ID to switch to.
    @param logoURL  A URL for their logo image.
    @returns A Promise if success.
     */
    public async switchUserAccount(land_id: string, _logoURL: string): Promise<void> {

        // do nothing if the user has the land_id
        if (land_id === sessionStorage.land_id && await this.hasValidAccessToken()) return;

        // ask the server to switch user
        try {
            const verificationResp: Response = await fetch(conf.apiURL + '/login/switch-user', {
                body: JSON.stringify({
                    land_id: land_id,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.accessToken
                },
                method: 'POST',
            });
            if (verificationResp.ok) {
                // delete state of the current user
                //   set switch-userID before removing login-userID so that other tabs
                //  don't logout.
                // setTimeout(() => {
                //     localStorage.removeItem('switch-' + this.userID);
                // }, 500);

                this.clearLoginState();  // but keep refresh token

                // save new user
                const verificationResponse: _VerifyAuthenticationResponse = JSON.parse(await verificationResp.text());
                this.saveAccessToken(verificationResponse);
                this.toast(this.tr('user.Switched to', {landid: land_id}));
            } else { // error, try Passkey sign in
                if (verificationResp.status == conf.HTTP_FORBIDDEN) {
                    // signin may raise an error
                    await this.authenticate({land_id_or_userID: land_id});
                    this.toast(this.tr('user.Switched to', {landid: land_id}));
                    return;
                    // we don't remove AT stored in localStorage to avoid disrupting other tabs
                } else {
                    const msg: string = await verificationResp.text();
                    console.log('switchUserAccount: ' + msg);
                    this.toast(this.tr(msg));
                    throw new conf.NetworkError(msg);
                }
            }
        } catch(_err: any) {
            const err: Error = _err;
            if (err instanceof conf.NetworkError && await navigator?.serviceWorker?.getRegistration('/')) {
                //? what can we do?
            }
            if (err.message === 'Passkey canceled') return;

            if (err.message === 'Passkey not found') {
                // not found on server
                return this.showErrorDialog(this.tr("passkey.not found", {user: land_id}));
            }
            this.toast(this.tr(err.message));
            throw err;
        }
    }

    /**
       Logout to clear the access and refresh tokens.

       This works even without an access token, as we need to make server logout in order to clear
       the refresh token cookies.

       Navigates route to the top by default. This does not throw an error, even if network error.

       @param continueable   If true, the user can continue after reauthenticate, otherwise forget the user.
       @param navigateToTop  If true (default), navigate route to top.
       @param all             True to deauthenticate all users on the device.
    */
    async logout(): Promise<void> {
        this.clearLoginState();

        if (!this.userID) return;

        const resp: Response = await fetch(conf.apiURL + '/login/passkey-logout', {
            body: JSON.stringify({
                userID: this.userID
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });

        this.toast(this.tr('user.Logged out'));

        if (!resp.ok) {
            const msg: string = await resp.text();
            console.log('deauthenticate: ' + msg);
            // always success
        }
    }

    /** Clears login state. usable for reauthenticate.

     @param continueable If true, the user can continue after reauthenticate, otherwise forget the user.
     @param navigateToTop If true, navigate route to top.
     @param isLogin If true, it is for login.
     @param all          True to remove all localStorage and sessionStorage values for all users on the device.
     */
    clearLoginState() {
        this.accessToken = undefined;
        this.userID = undefined;
        this.orgID = undefined;

        browser.storage.local.remove('userID');
        browser.storage.local.remove('land_id');
        browser.storage.local.remove('AT');
        browser.storage.local.remove('AT_exp');
        browser.storage.local.remove('switch');

    }

    /**
    Save access token into memory and localStorage.

    We use localStorage with keys with userID such like AT-userID because multiple apps in tabs with
    the same user account can share the same access token.
     */
    private saveAccessToken(verificationResponse: _VerifyAuthenticationResponse) {
        this.accessToken = verificationResponse.at;
        this.userID = verificationResponse.userID;

        // save in localStorage with userID
        browser.storage.local.set({
            'AT': verificationResponse.at,
            'AT_exp': Number(verificationResponse.atExp),
            'userID': verificationResponse.userID,
            'land_id': verificationResponse.land_id,
        //{ 'login-', 'true');
        });

        // // cause storage event listeners on other tabs to abort ceremonies
        // localStorage.removeItem('abort-dialog-' + this.passkeyUserID);
        // setTimeout(() => {
        //     localStorage.setItem('abort-dialog-' + this.passkeyUserID, 'hello');
        // }, 0);

        // App.app.eventAggregator.publish(new AccessTokenEvent());
    }

    /**
     Restore access token and important variables from sessionStorage or localStorage.
     The sessionStorage and localStorage are volatile on Safari and are erased after 7-day absense.

      @param offline - true to use old access token
        In offline mode, a dummy access token is used.
            When a service worker receives a dummy access token, it does not fetch and instead returns a cached response or an error.
            The `hasValidAccessToken()` function in the user-service returns `false` if a dummy access token is provided, and if not in offline mode, a hydra login will be performed.
     */
    public async restoreAccessToken() {
        const { userID, accessToken, accessTokenExpiration, land_id } = await browser.storage.local.get(['userID', 'AT', 'AT_exp', 'land_id']);
        this.userID = userID;

        if (this.userID) {
            this.accessToken = accessToken;
            this.accessTokenExpiration = accessTokenExpiration;
            this.land_id = land_id;
        } else {
            this.userID = undefined;
            this.accessToken = undefined;
            this.accessTokenExpiration = undefined;
            this.land_id = undefined;
            return;
        }
    }

    /**
    Restores an access token from localStorage so that multiple apps in tabs can share it.
    Then checks if it is valid.

    this.userID must not be undefined.
     */
    public async hasValidAccessToken(): Promise<boolean> {
        const { accessToken, expiration } = await browser.storage.local.get(['AT', 'AT-exp']);
        this.accessToken = accessToken

        if (this.accessToken
            && expiration > (Date.now()/1000 + 2)   // 2 sec margin
            && this.hasValidRefreshToken()) {
                return true;
            } else {
                return false;
            }
    }

    /**
    Check if we have a valid refresh token in cookies.

    this.userID must not be undefined.
     */
    public hasValidRefreshToken(): boolean {
        return true; //YYY
        // const expiration: number = Number(this.cookies['RT-exp-' + this.userID] || "0");

        // return expiration > (Date.now()/1000 + 2*60)   // 2 min margin
    }

    /** Shows a msg. */
    toast(msg: string) {
        console.log(msg);
    }

    /** Translates a string. */
    tr(msg: string, _param?: any): string {
        return msg;
    }
}

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomString(n: number, source=chars): string {
    let result = '';

    for (let i = 0; i < n; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += source.charAt(randomIndex);
    }
    return result;
}
