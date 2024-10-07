import {ParsePageResult, ShopPrice, Currency} from '../types.ts';
import {stripHTML, decodeHtmlEntities, replaceURLToAbsolute, addTargetBlankToHref} from '../utils/utils.ts';
import {MaxImageURLs} from "../conf.ts";


/**
 * parse ld+json and set parsePageResult
 *
 * @param ldjson - parsed ld_json object
 * @param url - target url.
 * @param parsePageResult - result.
 * @param ignoreError - for unittest, true to raise error
 * @return void
 *
 * @tests deno test -A  src/test/parser/ld-parser_test.ts
 */
export function parseLdjson(ldjson: any, url: string, parsePageResult: ParsePageResult, ignoreError: boolean = true): void {
    if (!ldjson) return;
    if (parsePageResult.isCompleted()) return;

    if (typeof ldjson === 'string') {
        try {
            ldjson = JSON.parse(decodeHtmlEntities(ldjson));
        } catch(error: any) {
            if (!ignoreError) {
                throw error;
            } else {
                console.error(error);
            }
            return;
        }
        if (!ldjson) return;
    }

    if (Array.isArray(ldjson)) {
        // If ld_json is an array, call self recursive.
        ldjson.forEach(data => {
            parseLdjson(data, url, parsePageResult);
        });
    } else if (typeof ldjson === 'object') {
        // parse ld_json
        const graphData: any = ldjson['@graph'] || undefined;

        if (ldjson['@type'] === 'Product') {
            const product: any = ldjson;

            // 'offers' is list or dict: use first offer in offers
            let offers: any = product['offers'] || {};

            let itemOffereds: any = offers['itemOffered'] || {};
            let itemOffered: any = Array.isArray(itemOffereds) ? itemOffereds[0] : itemOffereds;

            // title: product.name or itemOffered.name
            if (!parsePageResult.title) {
                parsePageResult.title = decodeHtmlEntities(product['name'] || itemOffered['name']);
                if (parsePageResult.title) {
                    parsePageResult.title = decodeHtmlEntities(stripHTML(parsePageResult.title));
                }
            }

            // description:
            if (!parsePageResult.description) {
                parsePageResult.description = decodeHtmlEntities(addTargetBlankToHref(replaceURLToAbsolute(url, product['description'] || itemOffered['description'])));
                // if (parsePageResult.description) { // Don't escape description: use html
                //     parsePageResult.description = htmlEscape(parsePageResult.description);
                // }
            }

            // imageURL
            if (!parsePageResult.imageURLs || (parsePageResult.imageURLs.length < MaxImageURLs)) {
                let imageItems: any = product['image'] || itemOffered['image'];
                let imageURLs: string[] = [];
                if (Array.isArray(imageItems)){
                    for (let imageItem of imageItems) {
                        if (typeof(imageItem) === 'string') {
                            imageURLs.push(imageItem);
                        } else if (typeof(imageItem) === 'object') {
                            if (imageItem['@type'] === "ImageObject") {
                                if (imageItem['contentURL']) {
                                    imageURLs.push(imageItem['contentURL']);
                                } else if (imageItem['contentUrl']) {
                                    imageURLs.push(imageItem['contentUrl']);
                                }
                            }
                        }
                    }
                } else if (typeof(imageItems) === 'string') {
                    imageURLs.push(imageItems)
                }
                if (imageURLs.length > 0) parsePageResult.addImageURL(imageURLs, new URL(url).hostname);
            }

            // find shop price
            if (!parsePageResult.shopPrices) {
                let currencyCode: string | undefined = undefined;
                let priceValue: string | number | undefined = undefined;
                let aggregateOffer: any = null;
                let sellerName: string|undefined = undefined;

                if (offers) {
                    if (typeof offers === 'object') {
                        if (offers['@type'] === "AggregateOffer") {
                            aggregateOffer = offers;
                            if (typeof offers['offers'] === 'object') {
                                offers = offers['offers']; // aggregateOffer.offers
                            }
                        }
                    }

                    if (typeof offers === 'object' || Array.isArray(offers)) {
                        for (let offer of (Array.isArray(offers) ? offers : [offers])) {
                            if (typeof offer !== 'object' || !offer) continue;

                            const priceSpecification: any = offer['priceSpecification'] || {};
                            currencyCode = offer['priceCurrency'] || priceSpecification['priceCurrency'];
                            priceValue = offer['price'] || offer['minPrice'] || offer['lowPrice'] || offer['currentPrice'] || priceSpecification['price'] || priceSpecification['lowPrice'] || priceSpecification['minPrice'] || priceSpecification['currentPrice'];
                            // price or lowPrice
                            // lowPrice: etsy
                            // currentPrice: wowma.jp (not exists in schema.org??)

                            if (priceValue != undefined) {
                                if (!sellerName) sellerName = offer && offer['seller'] && offer['seller']['name'];
                                break
                                // parsePageResult.shopPrices = [
                                //     new ShopPrice("", url, new Currency(currencyCode, String(priceValue)))
                                // ];

                                // const seller: any = offer['seller'];
                                // if (seller && seller['name']) {
                                //     parsePageResult.shopPrices[0].name = seller['name'];
                                // }
                                // return;
                            }
                        }

                        // offer is not found, use aggregateOffer https://schema.org/AggregateOffer
                        if (priceValue == undefined && aggregateOffer) {
                            currencyCode = aggregateOffer['priceCurrency'];
                            priceValue = aggregateOffer['price'] || aggregateOffer['lowPrice'];
                            // if (priceValue != undefined) {
                            //     parsePageResult.shopPrices = [
                            //         new ShopPrice("", url, new Currency(currencyCode, String(priceValue)))
                            //     ];
                            //     parsePageResult.shopPrices[0].url = url;
                            // }
                        }
                    }
                }

                // Product.price/lowPrice/
                if (priceValue == undefined) {
                    priceValue = ldjson['price'] || ldjson['lowPrice'] || ldjson['minPrice'] || ldjson['currentPrice'];
                }
                if (currencyCode == undefined) currencyCode = ldjson["priceCurrency"];

                // make a shopPrice
                if (priceValue) {
                    parsePageResult.shopPrices = [
                        new ShopPrice(sellerName ? decodeHtmlEntities(sellerName) : "", url, new Currency(currencyCode, String(priceValue)))
                    ];
                }

            }
        } else if (ldjson['@type'] === 'ImageGallery') {
            /**
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "ImageGallery",
                  "url": "https://www.apple.com/jp/shop/product/G12Z3J/A/24インチiMac-整備済製品-8コアCPUと8コアGPUを搭載したApple-M1チップギガビットEthernet-シルバー",
                  "associatedMedia": [
                    {
                      "contentUrl": "https://as-images.apple.com/is/refurb-imac-24-pink-2021?wid=1000&hei=1000&fmt=jpeg&qlt=95&.v=1639423368000",
                      "thumbnailUrl": "https://as-images.apple.com/is/refurb-imac-24-pink-2021?wid=38&hei=38&fmt=jpeg&qlt=95&.v=1639423368000"
                    },

             */
            if (!parsePageResult.imageURLs || (parsePageResult.imageURLs.length < MaxImageURLs)) {
                let associatedMedia = ldjson["associatedMedia"];
                if (associatedMedia) {
                    const urls: string[] = [];
                    if (!Array.isArray(associatedMedia)) {
                        associatedMedia = [associatedMedia];
                    }
                    associatedMedia.forEach((media: any) => {
                        const contentUrl: string | undefined = media['contentUrl'];
                        if (contentUrl) {
                            urls.push(contentUrl);
                        }
                    });
                    if (urls.length > 0) {
                        parsePageResult.addImageURL(urls, new URL(url).hostname)
                    }
                }
            }
        } else if (ldjson['@type'] === 'WebPage') {
            /**
               e.g. https://www.ebay.com/p/25040975636?iid=154369068285
               {"@type":"WebPage","name":"Sony PS5 Digital Edition Console - White","url":"https://www.ebay.com/p/25040975636",
               "mainEntity":{"@type":"WebPageElement","offers":{"@type":"Offer","availability":"http://schema.org/InStock",
               "itemOffered":[{"@type":"Product","name":"Sony PS5 Digital Edition Console - White","url":"https://www.ebay.com/p/25040975636","image":"https://i.ebayimg.com/images/g/910AAOSwV5FhgtgV/s-l640.jpg","brand":"Sony","model":"Sony PlayStation 5 Digital Edition","mpn":"3006635","gtin13":"0711719541035","offers":[{"@type":"Offer","price":"94402.0","priceCurrency":"JPY"},{"@type":"Offer","price":"81133.0","priceCurrency":"JPY"},{"@type":"Offer","price":"78183.0","priceCurrency":"JPY"}...
            */

            const mainEntity: any = ldjson['mainEntity'];
            if (mainEntity && typeof mainEntity === 'object') {
                if (mainEntity['@type'] === "WebPageElement") {
                    let mainEntityOffer: any = mainEntity['offers'];
                    if (Array.isArray(mainEntityOffer)) {
                        mainEntityOffer = mainEntityOffer[0];
                    }
                    if (mainEntityOffer && typeof mainEntityOffer === 'object') {
                        let mainEntityItemOffered: any = mainEntityOffer['itemOffered'];
                        if (mainEntityItemOffered) {
                            if (Array.isArray(mainEntityItemOffered)) {
                                mainEntityItemOffered = mainEntityItemOffered[0];
                            }
                            if (typeof mainEntityItemOffered === 'object') {
                                parseLdjson(mainEntityItemOffered, url, parsePageResult); // Assuming you will handle html_string and head_string inside the function if necessary
                            }
                        }
                    }
                } else if (mainEntity){
                    // something else: e.g. {@type: Product} https://www.forever21.com/us/2001249188.html?dwvar_2001249188_color=01
                    parseLdjson(mainEntity, url, parsePageResult)
                }
            }
        } else if (ldjson['@type'] === 'WebSite') {
            if (!parsePageResult.siteName && ldjson['name']) {
                parsePageResult.siteName = ldjson['name'];
            }
        } else if (graphData) {
            parseLdjson(graphData, url, parsePageResult);
        }
    }
    return
}
