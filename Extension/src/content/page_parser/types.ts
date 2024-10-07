/**
 * This file is part of sessiontype.idl's _parsePageResult.
 * It includes classes and methods for parsing and handling page results, such as title, image URLs, description, and shop prices.
 *
 */


import {MaxImageURLs, XpathQueryTextLength, streamEndAnnotation} from './conf.ts';
import {sanitizeHtml} from './utils/sanitize.ts';
import {unescapeUnicode, xpathStringEscape, urlsAreEqual, replaceURLParam} from './utils/utils.ts';
import {patchBeforeSend} from './sites/sites-handler.ts';


/** textEncoder for controller.enqueue */
const textEncoder: TextEncoder = new TextEncoder();



/**
 * The ParsePageResult class stores and manages data parsed from a page.
 */
export class ParsePageResult {
    title: string|undefined;
    imageURLs: string[]|undefined;
    description: string|undefined;
    shopPrices: ShopPrice[]|undefined;
    siteName: string|undefined;
    blocked: boolean|undefined;  // fetch server is blocked.

    constructor(
        title?: string,
        imageURLs?: string[],
        description?: string,
        shopPrices?: ShopPrice[],
        siteName?: string,
        blocked?: boolean,
    ) {
        this.title = title;
        this.imageURLs = imageURLs;
        this.description = description;
        this.shopPrices = shopPrices;
        this.siteName = siteName;
        this.blocked = blocked;
    }


    /**
     * To check if all necessary properties are defined and non-empty
     *
     * @returns true for completed.
     *
     * @test src/test/types_test.ts parsePageResult
     */
    public isCompleted(): boolean {
        if (this.title &&
            (this.imageURLs && this.imageURLs.length > 0) &&
            this.description &&
            (this.shopPrices && this.shopPrices.length > 0)
           )
            return true;
        return false;
    }

    /**
     * Adds a new image URL or an array of URLs to the imageURLs array.
     * It skips the URLs that are already present in the array.
     * The array length is limited by the MaxImageURLs property.
     *
     * @param url A string representing a single URL or an array of URLs.
     * @param prepend insert the urls by unshift. (with urls.reverse())
     *
     * @returns void
     *
     * @test src/test/types_test.ts parsePageResult
     */
    public addImageURL(url: string|string[], domain: string, prepend?: boolean): void {
        // handle url as string or array of strings
        if (!url) return;
        if (this.imageURLs && this.imageURLs.length >= MaxImageURLs) return;

        const urls: string[] = (typeof url === "string") ? [url] : url;
        if (urls.length === 0) return;


        for (let ur of prepend ? urls.slice().reverse() : urls) { // slice() for keeping the original array
            // if the url is not in this.imageURLs, push it.

            // normalize url
            let u: string = "";
            if (ur.startsWith("//")) {
                u = ur.replace("//", "https://");
            } else if (ur.startsWith("http://")) {
                u = ur.replace("http://", "https://");
            } else if (ur.startsWith("https://")) {
                u = ur;
            } else if (ur.startsWith("/")) {
                // '/img/foo.jpg' -> 'https://request.land/img/foo.jpg'
                u = "https://" + domain + ur;
            } else if (ur.startsWith("data")) {
                //data:image...
                u = ur;
                continue; // data:image is too small encoded image -> ignore
            } else {
                // without protocol
                u = 'https://' + ur;
            }

            if (this.imageURLs == undefined) this.imageURLs = [];
            // if (this.imageURLs.indexOf(u) === -1) {
            if (!this.hasImageURL(u)) {
                let replacedURL: string = replaceURLParam(u, 'w', '800');
                replacedURL = replaceURLParam(replacedURL, 'width', '800');

                if (domain.includes("princesspolly.com")) {
                    // Why clopped??
                    // e.g. https://us.princesspolly.com/cdn/shop/products/3-model-info-Josephine-us2_f5f59134-0342-4e82-837c-cdbf440823c9.jpg?crop=center&height=81&v=1699306958&width=600
                    replacedURL = replacedURL.split("?")[0]
                }

                if (prepend) {
                    this.imageURLs.unshift(replacedURL)
                } else {
                    this.imageURLs.push(replacedURL)
                }
            };
            if (this.imageURLs.length >= MaxImageURLs) break;
        }
    }

    /**
     * reference for utils.urlsAreEqual
     */
    public hasImageURL(url: string): boolean {
        if (!this.imageURLs) return false;

        for (let imageURL of this.imageURLs) {
            if (urlsAreEqual(imageURL, url, ['w', 'width', 'h', 'height'])) return true;
        }
        return false;
    }

    /**
     * sanitize html properties
     *   Now, only 'description' is a HTML element.
     *
     * @test src/test/types_test.ts parsePageResult
     */
    public sanitize(): void {
        if (this.description) this.description = sanitizeHtml(this.description);
        return;
    }

    /**
     * send chunk
     * @param controller - To controller.enqueue()
     * @returns result JSON string.
     *
     * @test src/test/types_test.ts parsePageResult
     */
    public async send(url: string, controller?: ReadableByteStreamController): Promise<string> {
        let res: string = "";
        try {
            this.sanitize();
            patchBeforeSend(url, this);
            if (this.description) this.description = unescapeUnicode(this.description);
            res = JSON.stringify(this) + streamEndAnnotation;
            if (controller) controller.enqueue(textEncoder.encode(res));

            // XXX Wait for puppeteer: puppeteerFindDescriptionHTML
            // Can't run xpath query in response_parser now ...
            // https://github.com/denoland/deno/issues/18315
            // if (controller && this.isCompleted())  controller.close();
        } catch(error: any) {
            if (error.message !== "ReadableByteStreamController's stream is not in a readable state.") {
                // stream may be closed
                console.error(error); // ignore error
            }
        }
        return res;
    }

    /**
     * make xpath query for description
     * @returns XPATH query string
     *
     * @tests src/test/parser/puppeteer-parser_test.ts --filter test-parseOnPuppeteer
     */
    public makeXPathQueryForDescription(): {"query": string, "head": string, "tail": string|undefined}|undefined {
        if (!this.description) return undefined;
        const desc: string = this.description.replaceAll("\n","").replaceAll("\r", "");
        const head: string = desc.substring(0, XpathQueryTextLength)
        const excludeTags: string = "not(self::script) and not(self::style) and not(self::meta) and not(ancestor::script) and not(ancestor::style) and not(ancestor::meta)";

        // too short -> find itself
        if (desc.length < XpathQueryTextLength) {
            return {
                query: "//body//*[contains(., " + xpathStringEscape(head) + ") and " + excludeTags + "]",
                head: head,
                tail: undefined
            };
        }
        // else
        const tail: string = desc.substring(desc.length - XpathQueryTextLength)
        return {
            query: "//body//*[contains(., " + xpathStringEscape(head) + ") and contains(., " + xpathStringEscape(tail) + ") and " + excludeTags + "]",
            head: head,
            tail: tail,
        }
    }
}


/**
 * ShopPrice for ParsePageResult
 */
export class ShopPrice {
    name: string|undefined;
    url: string|undefined;
    price: Currency|undefined;

    constructor(name?: string, url?: string, price?: Currency) {
        this.name = name;
        this.url = url;
        this.price = price;
    }
}


/**
 * Currency for ParsePageResult
 */
export class Currency {
    code: string|undefined;
    private value: string|undefined; // parsed*1000

    constructor(code?: string, value?: string) {
        this.code = code;
        this.value = value && value.replace(/[^0-9.]/g, '');
    }

    /**
     * getter/setter valueStr: currency Value string without ',', '$'.
     *
     * @test src/test/types_test.ts parsePageResult
     */
    set valueStr(value: string|undefined) {
        if (value) {
            this.value = value.replace(/[^0-9.]/g, '');
        } else {
            this.value = value;
        }
    }

    get valueStr(): string|undefined {
        return this.value;
    }
}



/**
 * types for Proxy
 */


/**
 * countryCode -> proxyIP
 */
export interface ProxyIPsForCountry {
    countryCode: string;                // proxy server country
    proxyIPs: string[];                 // proxy server ip list
    index: number;                      // index for rotation
}

/**
 * Map for CountryCode -> ProxyIPs
 */
export interface ProxyIPsForCountryMap {
    [countryCode: string]: ProxyIPsForCountry;
}


/**
 * blocked Domain
 */
export interface BlockedDomain {
    domain: string;                     // domain name
    lastBlockedDate: Date;              // last blocked date for detect 24h
    count: number;                      // blocked count
}

/**
 * blocked domains
 */
export interface BlockedDomainMap {
    [domain: string] : BlockedDomain;   // {'example.com': {Date, count}}
}

/**
 * queue for throttling
 */
export interface UseQueue {
    [domain: string]: number; // counter
}

/**
 * Puppeteer-cluster instance and the status
 */
export interface ClusterAndStatus {
    // Assuming a Cluster type from puppeteerCluster or similar library.
    cluster: any; // Replace `any` with actual cluster type.
    blockedDomainMap: BlockedDomainMap;    // blockedDomain list
    useQueue: UseQueue;                 // {'example.com': 2, 'foo.com': 3, ...}
    ipAddress: string;                  // cluster's proxy ip
}
