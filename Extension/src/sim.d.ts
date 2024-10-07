import { ProtocolWithReturn } from "webext-bridge";
import { ParsePageResult } from './types';

declare module "webext-bridge" {
    export interface ProtocolMap {
        openTab: ProtocolWithReturn<{ url: string }, ParsePageResult>;
        parse: ProtocolWithReturn<{ }, ParsePageResult>;
    }
}
