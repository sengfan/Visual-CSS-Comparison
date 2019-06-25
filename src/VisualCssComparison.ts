/*
 * @Author: Zhou Fang
 * @Date: 2019-06-21 15:38:57
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-06-24 23:22:09
 */
import * as puppeteer from 'puppeteer';
import * as micromatch from 'micromatch';
import { WildCardReplaceRequests } from './model/WildCardReplaceRequests';
import { from } from 'rxjs';
import { Config } from './model/Config';

export class VisualCssComparison {
    constructor(public config: Config) {}
    /**
     * @date 2019-06-24
     * @param {puppeteer.Request} request
     * @param {WildCardReplaceRequests} replaceRequests
     * @returns {(boolean | string)}
     * @memberof VisualCssComparison
     */
    proxyFilter(
        request: puppeteer.Request,
        replaceRequests: WildCardReplaceRequests
    ): boolean | string {
        const isLegal = (key: string) => {
            if (
                !(
                    replaceRequests &&
                    replaceRequests[key] &&
                    Array.isArray(replaceRequests[key])
                )
            ) {
                //  console.error(`illegal replaceRequests.${key}`);
                return false;
            }
            return true;
        };
        if (
            isLegal('abortURLs') &&
            replaceRequests.abortURLs.some(wildCard => {
                micromatch.isMatch(request.url(), wildCard);
            })
        ) {
            return false;
        }

        // replace url

        if (
            isLegal('redirectURLs') &&
            replaceRequests.redirectURLs.some(wildCard => {
                micromatch.isMatch(request.url(), wildCard);
            })
        ) {
            const redirectDomain = replaceRequests.redirectDomain.endsWith('/')
                ? replaceRequests.redirectDomain.slice(0, -1)
                : replaceRequests.redirectDomain;
            return `${redirectDomain}${new URL(request.url()).pathname}`;
        }

        return true;
    }

    compareImage() {}

    async run() {
        const browser = await puppeteer.launch({ headless: false });

        const eachPageProgress = async (
            url,
            replaceRequests: WildCardReplaceRequests
        ) => {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', interceptedRequest => {
                const result = this.proxyFilter(
                    interceptedRequest,
                    replaceRequests
                );
                if (result === true) {
                    interceptedRequest.continue();
                } else if (result === false) {
                    interceptedRequest.abort();
                } else if (typeof result === 'string') {
                    interceptedRequest.continue({ url: result });
                } else throw new Error('proxy Filter result is not right');
            });
            await page.goto(url);

            await page.screenshot({ path: 'example.png' });
            await page.close();
        };

        const progress$ = this.config.urlLists.flatMap(urlList => {
            const singleProgress = urlList.url.map(url =>
                from(eachPageProgress(url, urlList.replaceRequests))
            );
            return singleProgress;
        });
        console.log(progress$);
        this.config.urlLists.forEach(urlList => {
            urlList.url.forEach(url => {
                eachPageProgress(url, urlList.replaceRequests);
            });
        });

        // await browser.close();
    }
}
