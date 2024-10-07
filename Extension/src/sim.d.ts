import { ProtocolWithReturn } from "webext-bridge";

declare module "webext-bridge" {
    export interface ProtocolMap {
        openTab: ProtocolWithReturn<{ url: string }, { tabId: number|undefined }>;
        parse: ProtocolWithReturn<{ }, { }>;
    }
}
