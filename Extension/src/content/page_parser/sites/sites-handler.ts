/**
 * specific sites fix handler
 */

import {ParsePageResult, ShopPrice, Currency} from '../types.ts';
import {fixNordstromShopPrice} from './nordstrom.ts';

const robotOrHumanPattern = /robot\s*or\s*human/i;
const captchaPattern = /captcha/i;

export function patchBeforeSend(url: string, parsePageResult: ParsePageResult): void {
    let domain: string = new URL(url).hostname;
    if (['nordstrom.com', 'www.nordstrom.com'].indexOf(domain)>=0) {
        fixNordstromShopPrice(parsePageResult);
    }

    // remove "robot or human" from title
    if (parsePageResult?.title) {
        if (robotOrHumanPattern.test(parsePageResult.title) || captchaPattern.test(parsePageResult.title)) {
            parsePageResult.title = "";
        }
    }
}
