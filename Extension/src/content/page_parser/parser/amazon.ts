import {ParsePageResult, ShopPrice, Currency} from '../types.ts';
import {WaitForBodyTimeout} from '../conf.ts';
import {addTargetBlankToHref, replaceURLToAbsolute, decodeHtmlEntities, replaceOlWithUl} from "../utils/utils.ts";

/** prefix:  https://www.amazon.com, https://www.amazon.co.jp, ... */
const domainPrefixed = ['www.amazon.', 'www.amzn.', 'amazon.', 'amzn.'];
/** exacts:  https://www.a.co, https://a.co for shareing url on amazon.com */
const domainExacts = ['www.a.co', 'a.co'];

/**
 * Checks if the provided domain is an Amazon domain.
 *
 * @param domain - 'amazon.com' 'request.land'...
 * @returns true or false
 */
export function isAmazonDomain(domain: string): boolean {
    return domainPrefixed.some(prefix => domain.startsWith(prefix)) || domainExacts.includes(domain);
}




function rewriteImageUrl(url) {
    const regex = /\/([^/]+)\._[^/]+_\.(.+)$/;
    return url.replace(regex, (match, p1, p2) => `/${p1}.${p2}`);
}

// メインの関数
export function parseAmazonPage(url) {
    const parsePageResult = new ParsePageResult();
    parsePageResult.siteName = "Amazon";
    parsePageResult.title = decodeHtmlEntities(document.title);

    // 商品ページかどうかを確認
    const titleSelector = "#productTitle";
    const hasProductTitle = !!document.querySelector(titleSelector);

    if (!hasProductTitle) {
        // 商品ページでない場合はタイトルのみを返す
        return parsePageResult;
    }

    // データを抽出
    parseAmazon(document, url, parsePageResult);

    return parsePageResult;
}

function parseAmazon(document, url, parsePageResult) {
    const titleElement = document.querySelector("#productTitle");
    if (titleElement) {
        parsePageResult.title = decodeHtmlEntities(titleElement.innerText.trim());
    }

    // 説明文の抽出
    const descriptionElements = document.querySelectorAll("#feature-bullets, #aplus, #productDescription_feature_div, #bookDescription_feature_div");
    const descriptions = [];
    descriptionElements.forEach(element => {
        // 不要な要素を削除
        const removeElements = element.querySelectorAll('.video-js, style');
        removeElements.forEach(removeElement => removeElement.remove());

        // ブランドストーリーを無視
        if (element.parentElement && element.parentElement.id === "aplusBrandStory_feature_div") return;

        if (element.innerHTML) descriptions.push(element.innerHTML);
    });

    if (descriptions.length > 0) {
        const descriptionHTMLStr = '<div class="amazon">' + descriptions.join("<p></p>") + '</div>';
        parsePageResult.description = decodeHtmlEntities(addTargetBlankToHref(replaceURLToAbsolute(url, descriptionHTMLStr)));
    }

    // 画像の抽出
    const imageSelector = "#altImages li:not(.aok-hidden) img, #imgTagWrapperId img";
    const imageElements = document.querySelectorAll(imageSelector);
    const imageUrls = [];
    imageElements.forEach(img => {
        const src = img.getAttribute('src');
        if (src) imageUrls.push(rewriteImageUrl(src));
    });
    parsePageResult.addImageURL(imageUrls, url);

    // 価格の抽出
    const priceSelector = "#buybox .a-price .a-offscreen, #buybox #kindle-price";
    const priceElement = document.querySelector(priceSelector);
    if (priceElement) {
        let priceTxt = priceElement.innerText;
        // 通貨記号の置換
        priceTxt = priceTxt.replace(/¥|￥/g, 'JPY');
        priceTxt = priceTxt.replace(/\$/g, 'USD');

        const regex = /([A-Z]{3})(\d{1,3}(,\d{3})*(\.\d+)?)\b/;
        const match = priceTxt.match(regex);

        if (match) {
            const price_code = match[1];
            let price_value = match[2].replace(/,/g, '');
            parsePageResult.shopPrices = [
                new ShopPrice("Amazon", url, new Currency(price_code, String(price_value)))
            ];
        }
    }

    return parsePageResult;
}

// // 使用例
// const url = window.location.href;
// const result = parseAmazonPage(url);
// console.log(result);


// /**
//  * Amazon handler
//  *
//  * product page -> return data
//  * not product page -> return only page title
//  *
//  * Attention: Can't pass selectors to page.evaluate(). so they are defined in page.evaluate() in the code below too...
//  */

// import {ParsePageResult, ShopPrice, Currency} from '../types.ts';
// import {WaitForBodyTimeout} from '../conf.ts';
// import {addTargetBlankToHref, replaceURLToAbsolute, decodeHtmlEntities, replaceOlWithUl} from "../utils/utils.ts";


// /** prefix:  https://www.amazon.com, https://www.amazon.co.jp, ... */
// const domainPrefixed = ['www.amazon.', 'www.amzn.', 'amazon.', 'amzn.'];
// /** exacts:  https://www.a.co, https://a.co for shareing url on amazon.com */
// const domainExacts = ['www.a.co', 'a.co'];


// /**
//  * selectors for waitforselector.
//  * Can't pass selectors to page.evaluate(). so they are defined in page.evaluate() in the code below too...
//  */
// const titleSelector: string = "#productTitle";
// const imageSelector: string = "#altImages li:not(.aok-hidden) img, #imgTagWrapperId img";
// const priceSelector: string = "#buybox .a-price .a-offscreen, #buybox #kindle-price";
// const descriptionSelector: string = "#productDescription_feature_div, #aplus, #bookDescription_feature_div";


// /** timeouts */
// const selectorTimeout: number = 5000;     // ms
// const productTitleTimeout: number = 7000; // ms
// const descriptionTimeout: number = 3000;  // ms


// /**
//  * Fetch and parse: Amazon product page.
//  *
//  * @param page - The page object to operate on.
//  * @param controller - A ReadableByteStreamController object.
//  * @param url - product page url.
//  * @returns A ParsePageResult promise.
//  *
//  * @tests src/test/parseRealPage_test.ts test-getParsePageResult
//  */
// export async function amazonFetchAndParse(page: any, controller: ReadableByteStreamController|undefined, url: string): Promise<ParsePageResult> {
//     const parsePageResult = new ParsePageResult();
//     parsePageResult.siteName = "Amazon";

//     console.debug("Benchmark: amazon fetch start " + (new Date()).toISOString());
//     // fetch
//     page.goto(url, {waituntil: "domcontentloaded", timeout: 1}).catch((err: any) => {})
//     // if product title none -> not product page -> return only title.
//     const hasProductTitle: boolean = await page.waitForSelector(titleSelector, {timeout: productTitleTimeout}).then((_: any) => {return true}).catch((err: any) => {return false});

//     if (!hasProductTitle) {
//         try {
//             await page.waitForSelector("body", {timeout: WaitForBodyTimeout})
//             parsePageResult.title = decodeHtmlEntities(await page.title().catch((err: any) => {console.error(err.toString()); return undefined}));
//             parsePageResult.send(url, controller);
//         } catch (error: any) {
//             // e.g. body timeout error
//             console.error(error.toString());
//             // ignore error
//         }
//         return parsePageResult;
//     }

//     // wait page
//     await Promise.all([
//         page.waitForSelector(titleSelector, {timeout: selectorTimeout}).catch((_: any) => {return null}),
//         page.waitForSelector(imageSelector, {timeout: selectorTimeout}).catch((_: any) => {return null}),
//         page.waitForSelector(priceSelector, {timeout: selectorTimeout}).catch((_: any) => {return null}),
//         // Don't wait description: it takes time... page.waitForSelector(descriptionSelector, {timeout: 3000}).catch((err: any) => {return null}),
//     ]);

//     await parseAmazon(page, url, parsePageResult);
//     JSON.stringify(parsePageResult)
//     parsePageResult.send(url, controller);
//     console.debug("Benchmark: amazon parse1 end " + (new Date()).toISOString());

//     // wait for description and retry
//     await Promise.all([
//         page.waitForSelector(descriptionSelector, {timeout: descriptionTimeout}).catch((_: any) => {return null}),
//     ])
//     await parseAmazon(page, url, parsePageResult);
//     parsePageResult.send(url, controller);
//     return parsePageResult;

// }


// /**
//  * Extracts information from an Amazon product page and adds it to a ParsePageResult object.
//  *
//  * @param page - The page object to operate on.
//  * @param url - The URL of the product page.
//  * @param parsePageResult - The ParsePageResult object to be updated with the extracted information.
//  * @returns A ParsePageResult Promise.
//  *
//  * @tests src/test/amazon_test.ts test-parseAmazon
//  */
// export async function parseAmazon(page: any, url: string, parsePageResult: ParsePageResult): Promise<ParsePageResult> {

//     const titleQuery = "#productTitle";
//     const titleStr = await page.$eval(titleQuery, (element: any) => element ? element.innerHTML: null).catch(() => null);
//     if (titleStr) parsePageResult.title = decodeHtmlEntities(titleStr);

//     // let description_query = "#aplusBatch_feature_div, #aplusBrandStory_feature_div, #centerCol, #productDescription_feature_div";
//     const descriptions: string[] = await page.evaluate(() => {
//         const descriptionQuery = "#feature-bullets, #aplus";
//         // @ts-ignore : run in headlesschrome
//         const descriptionElems = Array.from(document.querySelectorAll(descriptionQuery));

//         // Sometimes, there are two or more #productDescription_feature_div
//         // but they are includes same data...
//         // so, we use only one #productDescription_feature_div
//         //   e.g. https://www.amazon.com/dp/B00SNPCSUY
//         const productDescriptionElems = document.querySelectorAll("#productDescription_feature_div, #bookDescription_feature_div");
//         if (productDescriptionElems.length > 0) {descriptionElems.push(productDescriptionElems[0])};

//         const descriptions: string[] = [];
//         //@ts-ignore for xpath
//         for (let element of descriptionElems) {
//             const removeElements = element.querySelectorAll('.video-js, style');
//             removeElements.forEach((removeElement: any) => removeElement.remove());

//             // ignore brand story e.g. https://www.amazon.com/dp/B00SNPCSUY
//             if (element.parentElement && element.parentElement.id === "aplusBrandStory_feature_div") continue;

//             if (element.innerHTML) descriptions.push(element.innerHTML)
//         }

//         return descriptions;
//     }).catch(() => [])
//     if (descriptions) {
//         const descriptionHTMLStr: string = '<div class="amazon">' + (descriptions?.join("<p></p>") || "") + '</div>'
//         parsePageResult.description = decodeHtmlEntities(addTargetBlankToHref(replaceURLToAbsolute(url, descriptionHTMLStr)));
//     }


//     /* find image URLs
//      * 1. find main image (data-old-hires for large image)
//      * 2. find sub images which may include minified main image
//      * 3. add them to imageURLs with removing minified main image if exists
//      */

//     const mainImageURL: string|undefined = undefined
//     // XXX future work: usually shows thumbnail, fullsize when fullscreen image.
//     //    Now only show thumbnail.
//     // const mainImageURL: string|undefined = await page.evaluate(() => {
//     //     const imgElem = document.querySelector("#imgTagWrapperId img")
//     //     if (imgElem) {
//     //         //@ts-ignore for xpath
//     //         let src: string|undefined = imgElem.getAttribute('data-old-hires') || imgElem.getAttribute('src')
//     //         if (src) return src;
//     //     }
//     // })

//     const imageUrls = await page.evaluate((args: any) => {
//         // let altImagesQuery = "#altImages li:not(.aok-hidden) img";
//         // @ts-ignore : run in headlesschrome
//         const altImagesElems = document.querySelectorAll(args.imageSelector);
//         const imageUrls: string[] = []
//         //@ts-ignore for xpath
//         for (let altImage of altImagesElems) {
//             //@ts-ignore for xpath
//             let src: string|undefined = altImage.getAttribute('src')
//             if (src) imageUrls.push(src)
//         }
//         return imageUrls;
//     }, {imageSelector: imageSelector})

//     const imageUrlsResult: string[] = [];
//     if (mainImageURL) {
//         // mainImageURL NEEDS _SL1000_, _SL1500_, ... so don't use rewriteImageUrl
//         imageUrlsResult.push(mainImageURL);
//         imageUrls.shift() // remove first url from imageUrls because first url is same as mainImageURL
//     }

//     // REMOVE _US40_, _??_, ... from imageUrls
//     const rewritedURLs: string[] = imageUrls.map((imageUrl: string) => rewriteImageUrl(imageUrl));

//     for (let rewritedURL of rewritedURLs) {
//         /* remove
//          *     https://images-na.ssl-images-amazon.com
//          *     ???-play-icon-overlay
//          */
//         if (!rewritedURL.includes("https://images-na.ssl-images-amazon.com") && !rewritedURL.includes("-play-icon-overlay")) {
//             imageUrlsResult.push(rewritedURL);
//         }
//     }

//     if (imageUrlsResult) parsePageResult.addImageURL(imageUrlsResult, url);


//     let priceTxt: string|null = await page.evaluate(() => {
//         const priceQuery: string = "#buybox .a-price .a-offscreen, #buybox #kindle-price";
//         // #buybox .a-price .a-offscreen (e.g. https://amzn.asia/d/20uCVWu)
//         // #buybox #kindle-price (e.g. https://amzn.asia/d/6GXIgcV)
//         // @ts-ignore : run in headlesschrome
//         const priceElems = document.querySelectorAll(priceQuery);

//         //@ts-ignore for xpath
//         let priceTxt: string|null = (priceElems && priceElems.length > 0) ? priceElems[0].innerText : null;
//         return priceTxt;
//     }).catch(() => null);
//     // GBP1.23 $3,999.45 ¥3,750, ...
//     // ¥ -> JPY, $ -> USD, others are three characters.
//     // https://www.amazon.co.jp/customer-preferences/edit
//     if (priceTxt) {
//         priceTxt = priceTxt.replace(/¥/g, 'JPY');
//         priceTxt = priceTxt.replace(/￥/g, 'JPY');
//         priceTxt = priceTxt.replace(/\$/g, 'USD');

//         const regex = /([A-Z]{3})(\d{1,3}(,\d{3})*(\.\d+)?)\b/;
//         // const regex = /([A-Z]{3})?(\d+(,\.\d+)?)/;
//         const match = priceTxt.match(regex);

//         if (match) {
//             const price_code = match[1];
//             let price_value = match[2].replace(/,/g, ''); // remove ','
//             parsePageResult.shopPrices = [
//                 new ShopPrice("Amazon", url, new Currency(price_code, String(price_value)))
//             ];
//         }
//     }

//     return parsePageResult;
// }



// /**
//  *********** utilities **********
//  */

// /**
//  * Checks if the provided domain is an Amazon domain.
//  *
//  * @param domain - 'amazon.com' 'request.land'...
//  * @returns true or false
//  */
// export function isAmazonDomain(domain: string): boolean {
//     return domainPrefixed.some(prefix => domain.startsWith(prefix)) || domainExacts.includes(domain);
// }


// /**
//  * Rewrites a URL by modifying the filename part of the URL.
//  * Specifically, it removes characters between two underscores within the filename.
//  *
//  * @param url - The URL to be rewritten.
//  * @returns rewrited url
//  *
//  * @example
//  * // returns "http://example.com/images/image.jpg"
//  * rewriteUrl("http://example.com/images/image._x123_.jpg");
//  */
// export function rewriteImageUrl(url: string): string {
//     const regex = /\/([^/]+)\._[^/]+_\.(.+)$/;
//     return url.replace(regex, (match, p1, p2) => `/${p1}.${p2}`);
// }
