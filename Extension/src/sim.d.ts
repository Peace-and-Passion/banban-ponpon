/**
     Banban Ponpon: Protocol definitions

     @author Hirano Satoshi, Togashi Ayuto
     @copyright 2024 Peace and Passion
     @since 2024/10/02
 */
import { ProtocolWithReturn } from "webext-bridge";
import { ParsePageResult } from './content/page_parser/types';
import { UserInfo, UserInfoInquiry } from './types';

declare module "webext-bridge" {
    export interface ProtocolMap {

        /* Open a page on a tab to get its title and price information.

           Sender: Content script
           Receiver: Background script

           Param:   url A URL to open.
           Return:  ParsePageResult.
         */
        openPageOnTab: ProtocolWithReturn<{ url: string }, ParsePageResult>;

        /* Parse DOM and return title and price information.

           Sender: Background script
           Receiver: Content script

           Return:  ParsePageResult.
         */
        parsePage: ProtocolWithReturn<{ }, ParsePageResult>;

        /* Get UserInfo including access token from background script.

           Sender: Content script
           Receiver: Background script

           Return:  UserInfo.
         */
        getAccessTokenFromBackground: ProtocolWithReturn<{ }, UserInfo>;

        /* Get UserInfo including access token from context script.

           Sender: Background script
           Receiver: Content script

           Return:  UserInfo.
         */
        getUserInfo: ProtocolWithReturn<{ }, UserInfo>;
    }
}
