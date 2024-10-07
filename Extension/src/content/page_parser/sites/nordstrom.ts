/**
 * https://nordestrom.com
 * price in ld+json is USD.
 *    e.g. "priceCurrency":"JPY", "price":24,
 *         "priceCurrency":"USD", "price":24,  on a same page.
 */

import {ParsePageResult, ShopPrice, Currency} from '../types.ts';

export function fixNordstromShopPrice(parsePageResult: ParsePageResult) {
    if (parsePageResult.shopPrices && parsePageResult.shopPrices?.length > 0) {
        for (let shopPrice of parsePageResult.shopPrices) {
            if (shopPrice.price) shopPrice.price.code = "USD";
        }
    }
}
