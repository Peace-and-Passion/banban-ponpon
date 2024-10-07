import { ProtocolWithReturn } from "webext-bridge";
import type { ParsePageResult } from './types_dummy';

declare module "webext-bridge" {
    export interface ProtocolMap {
        openTab: ProtocolWithReturn<{ url: string }, ParsePageResult>;
        parse: ProtocolWithReturn<{ }, ParsePageResult>;
    }
}
