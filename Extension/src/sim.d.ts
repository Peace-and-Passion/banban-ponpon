import { ProtocolWithReturn } from "webext-bridge";
import { ParsePageResult } from './content/page_parser/types';

declare module "webext-bridge" {
    export interface ProtocolMap {
        openTab: ProtocolWithReturn<{ url: string }, ParsePageResult>;
        parse: ProtocolWithReturn<{ }, ParsePageResult>;
    }
}
