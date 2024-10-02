/**
  WebAuthn with Passkeys Authenticator

  @author Hirano Satoshi
  @since 2024/3/15
 */
import * as cookie from 'cookie';
export const D_ADDRESS_SEPARATOR = '//';
export const PasskeyCheckLoginTimeout = 62 * 1000;  // Login rentrance timeout: 62 sec
export const HTTP_FORBIDDEN = 403;         // Passkey server returns HTTP_FORBIDDEN
type UniqID = string;
export const is_local = true;
export const webExtID =  window.location.origin;
export let originUri = "https://request.land";
if (is_local) {
    originUri = "https://localhost:50000";
    // if (build_hostname.startsWith('ppa-')) {
    //     originUri = 'https://' + build_hostname + '.peace-and-passion.com' + ':50000';
    // } else {
    //     originUri = "https://localhost:50000";
    // }
}
export const apiURL = originUri;
export class NetworkError extends Error {}
export var ANON_USERID = 'tiaiUuAnon_user';
export var DEMO_ORGID = 'tiaiUoDemo_org';

declare class _VerifyAuthenticationResponse {
  public at: string;
  public atExp: number;
  public userID: string;

    constructor(args?: { at: string; atExp: number; userID: string; });
}

interface AuthenticateOptions {
    land_id_or_userID: string;
    checkLoginInProgress?: boolean;
}

export class AuthenticatorPasskeys {
    accessToken: string|undefined;                  // access token
    user: User;                           // current user
    userID: string = ANON_USERID;
    org: Org;                             // current org
    orgID: string = DEMO_ORGID;

    private checkLoginInProgress: boolean|Error = false;   // checkLogin() is in progress
    public cookies: {[key: string]: string} = {};    // parsed cookies
    openerID: string;                     // ID that opened this login page in a tab
    openerID_send: string;                // openerID of sender side
    tabInProgress: boolean = false;       // auth process in another tab in progress
    openProxyDialogPromise: Promise<any>  // promise to open-proxy-dialog

    constructor() {
        this.parseCookies();
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
    public async authenticate(options: AuthenticateOptions): Promise<void> {
        console.log('authenticate: start');
        return await this.processInAnotherTab(options.land_id_or_userID, false);

        // XXX in-extension passkey authentication was omitted.
    }

    public verifyServerResponseBody(verificationResponse: _VerifyAuthenticationResponse): _VerifyAuthenticationResponse {
        //console.log(funcName + 'OK');

        this.clearLoginState(false, false, true, false);  // don't clear localStorage
        this.saveAccessToken(verificationResponse);
        return verificationResponse;
    }

    /** Authenticate user or register passkey in another tab for Chrome PWA which does not support passkeys */
    public async processInAnotherTab(land_id: string|undefined, register: boolean): Promise<void> {
        return new Promise<void>(async (resolve, _reject) => {
            try {
                await this.processInAnotherTabBody(land_id, register, true);
                resolve();
            } catch (_err: any) {
                const err: Error = _err;
                // ouch! opening a tab blocked because user interaction such as pressing button is required.
                // open a open-proxy-dialog and wait for the user to press the button that calls processInAnotherTabBody().
                if (err.message === "Tab blocked") {
                    this.openProxyDialogPromise = this.showProxyingDialog({ land_id: land_id, showButton: true });

                    // processInAnotherTabBody() closes the dialog after receiving a message from the passkey proxy.
                    this.openProxyDialogPromise.then(() => {
                        resolve();
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

        if (register) {
            params = new URLSearchParams({mode: 'create-passkey', openerID: this.openerID_send});
            newTab = window.open(originUri + '/create-passkey-view?' + params.toString(), "_blank");
        } else {
            params = new URLSearchParams();
            if (land_id) params.set('land_id', land_id);
            newTab = window.open(originUri + '/app-login/' + this.openerID_send + '?' + params.toString(), "_blank");
        }

        if (!newTab) {
            throw new Error("Tab blocked");
        }

        if (openDialog) {
            // no open-proxy-dialog exists. Open one without the button.
            this.openProxyDialogPromise = this.showProxyingDialog({ land_id: land_id, showButton: false });
        }

        newTab.focus();

        return new Promise<void>((resolve, _reject) => {
            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== originUri || event.data?.openerID !== this.openerID_send) {
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
                if (!event.data?.error) {
                    this.verifyServerResponseBody(event.data);
                    console.log('authenticateInAnotherTab: OK');
                }

                // close the dialog XXX
                this.openProxyDialogPromise?.then((openDialogResult) => { openDialogResult.controller.cancel(); });

                resolve();
            };

            this.tabInProgress = true;
            window.addEventListener("message", handleMessage);

            // setTimeout(() => {
            //     window.removeEventListener("message", handleMessage);
            //     reject(new Error("Passkey canceled"));
            // }, 10000);
        });
    }

    cancelProcessInAnotherTab() {
        if (this.tabInProgress) {
            // send to this context to close the tab
            window.postMessage({openerID: this.openerID_send, 'error': 'Passkey canceled'}, originUri);
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
        const timeout = Date.now() + PasskeyCheckLoginTimeout;
        let showMsg = 0;      // show waiting... log msg only once

        try {
            // loop with sleep until timeout
            while (timeout > Date.now()) {
                // during waiting, refreshing access token or loging out may occur
                if (this.hasValidAccessToken() || this.userID ===  ANON_USERID) {
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
                    land_id_or_userID: sessionStorage.land_id || this.cookies.land_id || this.userID,
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

            if (err instanceof NetworkError && await navigator?.serviceWorker?.getRegistration('/')) {
                // network error and serviceworker exists -> AccessToken for offline mode
                console.log('checkLogin: ignore NetworkError. Maybe offline');
                this.restoreAccessToken(true); // true for setting the offline access token
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
        if (this.userID === ANON_USERID || this.hasValidAccessToken() || !this.hasValidRefreshToken()) return;

        const resp: Response = await fetch(apiURL + '/login/refresh-token', {
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
        if (land_id === sessionStorage.land_id && this.hasValidAccessToken()) return;

        // ask the server to switch user
        try {
            const verificationResp: Response = await fetch(apiURL + '/login/switch-user', {
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
                localStorage.removeItem('AT-' + this.userID);
                localStorage.removeItem('AT-exp-' + this.userID);
                localStorage.setItem('switch-' + this.userID, 'true');
                localStorage.removeItem('login-' + this.userID);
                setTimeout(() => {
                    localStorage.removeItem('switch-' + this.userID);
                }, 500);

                this.clearLoginState(false, false, true, true);  // but keep refresh token

                // save new user
                const verificationResponse: _VerifyAuthenticationResponse = JSON.parse(await verificationResp.text());
                this.saveAccessToken(verificationResponse);
                this.toast(this.tr('user.Switched to', {landid: land_id}));
            } else { // error, try Passkey sign in
                if (verificationResp.status == HTTP_FORBIDDEN) {
                    // signin may raise an error
                    // const oldUserID: UniqID = this.userID;
                    await this.authenticate({land_id_or_userID: land_id});
                    this.toast(this.tr('user.Switched to', {landid: land_id}));
                    return;
                    // we don't remove AT stored in localStorage to avoid disrupting other tabs
                } else {
                    const msg: string = await verificationResp.text();
                    console.log('switchUserAccount: ' + msg);
                    this.toast(this.tr(msg));
                    throw new NetworkError(msg);
                }
            }
        } catch(_err: any) {
            const err: Error = _err;
            if (err instanceof NetworkError && await navigator?.serviceWorker?.getRegistration('/')) {
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
    async logout(continueable: boolean, navigateToTop=true, all: boolean=false): Promise<void> {
        this.clearLoginState(continueable, navigateToTop, false, false, all);

        if (!all && this.userID === ANON_USERID) return;

        const resp: Response = await fetch(apiURL + '/login/passkey-logout', {
            body: JSON.stringify({
                userID: all ? 'all' : this.userID
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
    clearLoginState(continueable: boolean, navigateToTop=true, isLogin=false, keepRefreshToken=false, all=false) {
        this.accessToken = undefined;

        if (localStorage.userID === this.userID) {
            localStorage.removeItem('userID');
            localStorage.removeItem('land_id');
        }

        sessionStorage.removeItem('userID');
        sessionStorage.removeItem('land_id');

        // keep RT-exp-userID during switchUser() because other tabs watches it to detect logout().
        // So, deauthenticate() removes RT-exp-userID.

        // if (!keepRefreshToken) {
        //     this.removeSavedUserOrg();
        // }

        // remove all localStorage and sessionStorage values except ones in the remain list.
        //   removal of ls.RT-exp-userID informs logout to other tabs
        for (let key in localStorage) {
            if (remain.indexOf(key) < 0) localStorage.removeItem(key);
        }
        for (let key in sessionStorage) {
            if (remain.indexOf(key) < 0) sessionStorage.removeItem(key);
        }

            this.resetUnreadForLogout(this.userID, isLogin);
            //sessionStorage.removeItem('land_id');
            sessionStorage.removeItem('setup');

            this.eventAggregator.publish(new WillLogoutEvent(this.userID, isLogin));

            // set Anon to userID, user, org...
            this.setupAnonUser();

            // emit a logout event
            this.log.debug("Sending DidLogoutEvent");
            this.eventAggregator.publish(new DidLogoutEvent(this.userID, isLogin));

            // App.app.expertMode = false;
            App.app.changeColor(true);
        }
    }

    /**
    Save access token into memory and localStorage.

    We use localStorage with keys with userID such like AT-userID because multiple apps in tabs with
    the same user account can share the same access token.

    This also parses cookies.
     */
    private saveAccessToken(verificationResponse: usertypes._VerifyAuthenticationResponse) {
        this.accessToken = verificationResponse.at;
        this.userService.loginExperience = true;

        this.userID = sessionStorage.userID = localStorage.userID = this.passkeyUserID = verificationResponse.userID;

        // save in localStorage with userID
        localStorage.setItem('AT-' + this.passkeyUserID, verificationResponse.at);
        localStorage.setItem('AT-exp-' + this.passkeyUserID, String(verificationResponse.atExp));
        localStorage.setItem('login-' + this.passkeyUserID, 'true');

        // cause storage event listeners on other tabs to abort ceremonies
        localStorage.removeItem('abort-dialog-' + this.passkeyUserID);
        setTimeout(() => {
            localStorage.setItem('abort-dialog-' + this.passkeyUserID, 'hello');
        }, 0);

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
    public restoreAccessToken(offline?: boolean) {
        this.parseCookies();
        this.userID = this.passkeyUserID = sessionStorage.userID || localStorage.userID || this.cookies.userID;

        if (!this.userID) {
            this.userID = ANON_USERID;
            this.accessToken = undefined;
            return;
        }

        localStorage.userID = sessionStorage.userID = this.userID;

            // hasValidAccessToken() restores access token from localStorage
            if (this.hasValidAccessToken()) {
                this.userService.loginExperience = true;
            }
    }

    /**
    Restores an access token from localStorage so that multiple apps in tabs can share it.
    Then checks if it is valid.

    this.userID must not be ANON_USERID.
     */
    public hasValidAccessToken(): boolean {
        this.accessToken = localStorage.getItem('AT-' + this.userID);
        const expiration = Number(localStorage.getItem('AT-exp-' + this.userID) || "0");
        // const a = expiration > (Date.now()/1000 + 2) ;
        // const b = this.hasValidRefreshToken();

        if (this.accessToken
            && expiration > (Date.now()/1000 + 2)   // 2 sec margin
            && this.accessToken !== conf.OFFLINE_ACCESS_TOKEN
            && this.hasValidRefreshToken()) {
                return true;
            } else {
                // keep invalid access token. don't show login button
                return false;
                // this.accessToken = undefined;
                // localStorage.removeItem('AT-' + this.userID);
            }
    }

    /**
    Check if we have a valid refresh token in cookies.

    this.userID must not be ANON_USERID.
     */
    public hasValidRefreshToken(): boolean {
        this.parseCookies();
        const expiration: number = Number(this.cookies['RT-exp-' + this.userID] || "0");

        return expiration > (Date.now()/1000 + 2*60)   // 2 min margin
    }

    /**
    Clear access token and localStorage
    this.userID must not be ANON_USERID.

     @param all             True to deauthenticate all users on the device.
     */
    public clearAccessToken(all=false) {
    }

    /**
      @returns Expiration time of the login session (with refresh).
     */
    public loginSessionExpiration(): number|undefined {
        this.parseCookies();
        const expiration: number = Number(this.cookies['RT-exp-' + this.userID] || "0");
        return Math.trunc(expiration);
    }

    /** parse document.cookie */
    parseCookies() {
        this.cookies = cookie.parse(document.cookie);
    }

    /** Shows a msg. */
    toast(msg: string) {
        console.log(msg);
    }

    /** Translates a string. */
    tr(msg: string, param?: any): string {
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
