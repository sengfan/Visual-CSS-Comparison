/*
 * @Author: Zhou Fang
 * @Date: 2019-06-21 15:38:57
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-06-25 19:46:05
 */
import * as puppeteer from 'puppeteer';
import * as micromatch from 'micromatch';
import { WildCardReplaceRequests } from './model/WildCardReplaceRequests';
import { from } from 'rxjs';
import { Config } from './model/Config';
import * as moment from 'moment';
import * as fs from 'fs';
import 'ts-polyfill/lib/es2019-array';

export class VisualCssComparison {
    config: Config = {
        urlLists: undefined,
        compare: true,
        allPhoto: true,
        mockDevice: ['iPhone X', 'desktop'],
        fileSavePath: './output'
    };
    constructor(config: Config) {
        if (config) this.setConfig(config);
    }
    /**
     * @date 2019-06-24
     * @param {puppeteer.Request} request
     * @param {WildCardReplaceRequests} replaceRequests
     * @returns {(boolean | string)}
     * @memberof VisualCssComparison
     */
    setConfig(config: Config) {
        this.config = { ...this.config, ...config };
    }
    proxyFilter(request: puppeteer.Request, replaceRequests: WildCardReplaceRequests): boolean | string {
        const isLegal = (key: string) => {
            if (!(replaceRequests && replaceRequests[key] && Array.isArray(replaceRequests[key]))) {
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

    creatFolderPath(url, device?: string) {
        const Timestamp = moment().format('YYYYMMDD');
        const folderName = new URL(url).pathname.split('/').join('-');
        const path = `${this.config.fileSavePath}/${Timestamp}/${folderName}/${device?device:''}`;
        fs.mkdirSync(path);
        return path;
    }
    async run() {
        const browser = await puppeteer.launch({ headless: false });
        const eachPageProgress = async (url, replaceRequests: WildCardReplaceRequests) => {
            const _url = new URL(url);
            let afterFix: string;
              
            const page = await browser.newPage();
            if (replaceRequests !== undefined) {
                await page.setRequestInterception(true);
                page.on('request', interceptedRequest => {
                    const result = this.proxyFilter(interceptedRequest, replaceRequests);
                    if (result === true) {
                        interceptedRequest.continue();
                    } else if (result === false) {
                        interceptedRequest.abort();
                    } else if (typeof result === 'string') {
                        interceptedRequest.continue({ url: result });
                    } else throw new Error('proxy Filter result is not right');
                });
                afterFix = 'modified';
            }
            const photoName = `${(url.search + url.hash).split(/[/?#=]/).join('-')}${'-'+afterFix}`;
            await page.goto(url);
            await page.screenshot({ path: `${this.creatFolderPath(url)}${photoName}` });
            await page.close();
        };

  /*        const progress$ = this.config.urlLists.flatMap(urlList => {
            const singleProgress = urlList.url.map(url => from(eachPageProgress(url, urlList.replaceRequests)));
            return singleProgress;
        }); */
   /*      console.log(progress$);  */
        this.config.urlLists.forEach(urlList => {
            urlList.url.forEach(url => {
                eachPageProgress(url, urlList.replaceRequests);
            });
        });

        // await browser.close();
    }
}
