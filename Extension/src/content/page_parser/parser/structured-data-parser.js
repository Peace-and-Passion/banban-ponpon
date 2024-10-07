/**
 * Can't run typescript on a browser: use Javascript
 */


/**
 * Searches for LD+JSON scripts in the HTML document and extracts their content.
 *
 * @param document {Document} - The HTML document to search in.
 * @returns {Array<string>} An array of LD+JSON strings found in the document.
 *
 * @tests deno test -A src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
 * @tests deno test -A  src/test/parser/response-parser_test.ts --filter 'parseResponse-ldjson'
 */
export function findLdjson(document) {
    // it is called on puppeteer-page (headless chrome)
    const res = [];
    // @ts-ignore
    const ldjsonElems = document.querySelectorAll('[type="application/ld+json"]');
    for (let ldjsonElem of ldjsonElems) {
        const ldjsonStr = ldjsonElem.innerHTML;
        if (ldjsonStr) res.push(ldjsonStr)
    }
    return res;
}


/**
 * Extracts microdata from the document and returns it as a JSON string.
 *
 * @param document {Document} - The HTML document to parse.
 * @returns {string} JSON string representation of the first product's microdata.
 *
 * @tests deno test -A src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
 * @tests deno test -A  src/test/parser/response-parser_test.ts --filter 'parseResponse-microdata'
 */
export function findMicrodata(document) {
    function parse(itemtype) {
        let elements = document.querySelectorAll(`[itemtype="http://schema.org/${itemtype}"], [itemtype="https://schema.org/${itemtype}"]`);
        if (!elements || elements.length == 0) {
            return null;
        }
        let element = elements[0];

        function extractLastPartFromUrl(url) {
            // https://schema.org/Product -> Product, https://schema.org/AggregateOffer -> AggregateOffer
            let parts = url.split('/');
            let lastPart = parts[parts.length - 1];
            return lastPart;
        }

        function parseElement(element) {
            const result = {};

            for (const child of element.children) {
                const itemprop = child.getAttribute('itemprop');
                if (child.hasAttribute('itemscope')) {
                    const parsedChild = parseElement(child);
                    if (itemprop) {
                        result[itemprop] = parsedChild;
                        const itmType = child.getAttribute('itemtype')
                        if (itmType) {
                            result[itemprop]['@type'] = extractLastPartFromUrl(itmType)
                        }
                    } else {
                        Object.assign(result, parsedChild);
                    }
                } else if (itemprop) {
                    const content = child.getAttribute('content') || child.innerHTML || child.getAttribute('src') || child.getAttribute('href');//child.textContent;

                    if (result[itemprop]) {
                        // already exists
                        if (itemprop === 'image') {
                            //e.g. rakuten <meta itemprop="image" content="aaa"><meta itemprop="image" content="bbb">
                            if (typeof result[itemprop] === 'string') {
                                result[itemprop] = [result[itemprop], content]; // image: ["aaa", "bbb"]
                            } else if (Array.isArray(result[itemprop])) {
                                result[itemprop].push(content);
                            } else {
                                console.error("can't happen")
                                // ??? ignore
                            }
                        }
                    } else {
                        // new
                        result[itemprop] = content;
                    }
                } else {
                    Object.assign(result, parseElement(child));
                }
            }

            return result;
        }

        const result = parseElement(element);
        result['@type'] = itemtype; // for parsing as a ld+json
        return result;
    }

    const result = parse("Product")
    return JSON.stringify(result);
}



/**
 * Finds and returns the content of a description meta tag.
 *
 * @param document {Document} - The HTML document to search in.
 * @returns {string|null} The content of the description meta tag, if found.
 *
 * @tests deno test -A src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
 * @tests deno test -A  src/test/parser/response-parser_test.ts --filter 'parseResponse-og'
 */
export function findDescription(document) {
    const elem = document.querySelector('meta[property="og:description"], meta[name="description"]')
    return elem?.content;
}


/**
 * Finds and returns the content of the Open Graph image meta tag.
 * @param document {Document} - The HTML document to search in.
 * @returns {string|null} The content of the Open Graph image meta tag, if found.
 *
 * @tests deno test -A src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
 * @tests deno test -A  src/test/parser/response-parser_test.ts --filter 'parseResponse-og'
 */
export function findOgImage(document) {
    const elem = document.querySelector('meta[property="og:image"]')
    return elem?.content;
}


/**
 * Finds and returns the content of the Open Graph product price meta tag.
 *
 * @param document {Document} - The HTML document to search in.
 * @returns {string|null} The content of the Open Graph product price meta tag, if found.
 *
 * @tests deno test -A src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
 * @tests deno test -A  src/test/parser/response-parser_test.ts --filter 'parseResponse-og'
 */
export function findOgPriceValue(document) {
    const elem = document.querySelector('meta[property="og:product:amount"], meta[property="og:price:amount"], meta[property="product:price:amount"]')
    return elem?.content;
}


/**
 * Finds and returns the content of the Open Graph product currency meta tag.
 *
 * @param document {Document} - The HTML document to search in.
 * @returns {string|null} The content of the Open Graph product currency meta tag, if found.
 *
 * @tests deno test -A src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
 * @tests deno test -A  src/test/parser/response-parser_test.ts --filter 'parseResponse-og'
 */
export function findOgPriceCode(document) {
    const elem = document.querySelector('meta[property="og:product:currency"], meta[property="og:price:currency"], meta[property="product:price:currency"], meta[property="og:product:currencyCode"], meta[property="og:price:currencyCode"], meta[property="product:price:currencyCode"]')
    return elem?.content;
}

/**
 * Finds and returns siteName
 *
 * @param document {Document} - The HTML document to search in.
 * @returns {string|null} The content of the Open Graph product currency meta tag, if found.
 *
 * @tests deno test -A  src/test/parse-real-pages_test.ts --filter getParsePageResult
 *
 * application-name: mercari
 * product:retailer_title: ec-cube
 * al:ios:app_name al:android:app_name : gap
 * apple-mobile-web-app-title: request.land
 * meta[name="author"]: net a porter
 */
export function findSiteName(document) {
    // first search og:site_name
    let elem = document.querySelector('meta[property="og:site_name"], meta[name="og:site_name"]')
    if (elem?.content) return elem.content;
    // fallbacks
    elem = document.querySelector('meta[name="application-name"], meta[property="product:retailer_title"], meta[property="al:ios:app_name"], meta[property="al:android:app_name"], meta[name="apple-mobile-web-app-title"], meta[name="author"]')
    return elem?.content;
}

/**
 * find images from main image
 * @param mainImageURL
 */
export function findImagesFromMainImage(document, mainImageURL) {
    const res = [];

    function findParent(elem) {
        const parent = elem.parentNode;
        if (!parent) return undefined;
        if (["span", "SPAN", "a", "A", "p", "P", "picture", "PICTURE", "button", "BUTTON", "li", "LI", ""].indexOf(parent.tagName) >= 0)  return findParent(parent);
        return parent;
    }


    // https://foo.com/imgURL.jpg?hoge=3 -> imgURL.jpg
    let imageName = "";
    // Find the last '/' in the URL
    const lastSlashIndex = mainImageURL.lastIndexOf('/') + 1;
    // Check if there are query parameters
    const queryParamIndex = mainImageURL.indexOf('?', lastSlashIndex);
    if (queryParamIndex !== -1) {
        // Extract the substring from the last '/' to the start of query parameters
        imageName = mainImageURL.substring(lastSlashIndex, queryParamIndex);
    } else {
        // If no query parameters, extract from the last '/' to the end of the string
        imageName = mainImageURL.substring(lastSlashIndex);
    }

    // remove jpg png, ...
    // Because some website set size on url.
    // KJC_Holiday_23_GS_PosieKGlossLinerDuo_Closed_V2_ad00d305-19cb-4f78-9e48-d63b894b9ab2.jpg -> KJC_...ab2_800.jpg
    // e.g. https://kyliecosmetics.com/products/high-gloss-liner-duo?variant=44661615493362
    if (imageName.length > 4) imageName = imageName.replace(/\.\w{2,4}$/, ''); // remove .jpg, .png, ...

    const imageElems = document.querySelectorAll('img') // XXX TODO <picture> and <source srcset>
    const elems = Array.from(imageElems).filter((img => {return img.src.includes(imageName) || img.srcset.includes(imageName)}));
    if (elems?.length > 0) {
        for (let elem of elems) {
            let parent = elem;
            let i = 0;
            for (let i = 0; i < 4; i++) {
                let foundParent = findParent(parent);
                if (foundParent) {
                    parent = foundParent;
                } else {
                    break; // not found
                }
            }

            const imgElems = parent.querySelectorAll("img")
            for (let imgElem of imgElems || []) {
                if (imgElem.src) res.push(imgElem.src)
            }

            // ZZZ
            // const parent = findParent(elem);
            // console.log(parent.tagName)
            // if (!parent) continue
            // let grandParent = findParent(parent);
            // if (!grandParent) grandParent = parent;
            // console.log(grandParent.tagName)
            // const imgElems = grandParent.querySelectorAll("img")
            // for (let imgElem of imgElems || []) {
            //     if (imgElem.src) res.push(imgElem.src)
            // }
        }
    }

    return res;
}


/**
 * for puppeteer.page.addScriptTag()
 * Makes the functions available in the global window object if it exists.
 */
if (typeof window !== "undefined") {
    window.findLdjson = findLdjson;
    window.findMicrodata = findMicrodata;
    window.findDescription = findDescription;
    window.findOgImage = findOgImage;
    window.findOgPriceValue = findOgPriceValue;
    window.findOgPriceCode = findOgPriceCode;
    window.findSiteName = findSiteName;
    window.findImagesFromMainImage = findImagesFromMainImage;
}
