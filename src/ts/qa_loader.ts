/*
 * @Author: Zhou Fang
 * @Date: 2019-06-21 15:38:57
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-06-21 16:04:57
 */
import * as puppeteer from 'puppeteer';
import * as micromatch from 'micromatch';
interface UrlList {
    url: string;
    replaceRequests: string[];
    executeScript: string[];
}

class Config {
    constructor(
        public compare = true,
        public allPhoto = true,
        public urlLists: UrlList[]
    ) {}
}
export class VisualCssComparison {
    constructor(private config: Config) {}
    proxyFilter(request: string): boolean | string {
        return true;
    }
    replaceRequest(): string {
        return '123';
    }
    compareImage() {}

    async run() {
        const browser = await puppeteer.launch({ headless: false });

        const eachPage = async urlList => {
            const page = await browser.newPage();

            await page.setRequestInterception(true);
            page.on('request', interceptedRequest => {
                const result = this.proxyFilter(interceptedRequest.url());
                if (result === true) {
                    interceptedRequest.continue();
                } else if (result === false) {
                    interceptedRequest.abort();
                } else if (typeof result === 'string') {
                    interceptedRequest.continue({ url: result });
                } else throw new Error('proxy Filter result is not right');
            });
            await page.goto('https://example.com');

            await page.screenshot({ path: 'example.png' });
            await browser.close();
        };
    }
}
