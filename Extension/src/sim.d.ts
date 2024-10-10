import { ProtocolWithReturn } from "webext-bridge";
import { ParsePageResult } from './content/page_parser/types';

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

        /* Get Access Token from background script.

           Sender: Content script
           Receiver: Background script

           Return:  Access token.
         */
        getAccessTokenFromBackground: ProtocolWithReturn<{ }, string|null>;

        /* Get Access Token from context script.

           Sender: Background script
           Receiver: Content script

           Return:  Access token.
         */
        getAccessTokenFromContextScript: ProtocolWithReturn<{ }, string|null>;
    }
}
