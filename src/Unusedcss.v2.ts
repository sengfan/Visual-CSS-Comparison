/*
 * @Author: Zhou Fang
 * @Date: 2019-06-28 15:51:36
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-07-02 14:07:10
 */

import * as puppeteer from 'puppeteer';
import * as Devices from 'puppeteer/DeviceDescriptors';
import * as micromatch from 'micromatch';
import { WildCardReplaceRequests } from './model/WildCardReplaceRequests';
import { defer, merge } from 'rxjs';
import { Config } from './model/Config';
import * as moment from 'moment';
import * as fs from 'fs';
import 'ts-polyfill/lib/es2019-array';
import { config, searchAreaPageUrlList, searchAreaCssList, spillAreaHousewaresPageUrlList, spillAreaCssList } from '../example/config';
import { mergerRange } from './model/merge';

const util = require('util');
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));
let browserOptions = {
    /*  args: [
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--enable-remote-extensions',
        '--user-data-dir'
    ], */
    headless: false,
    // userDataDir: 'C:\\Users\\sengfan\\AppData\\Local\\Google\\Chrome\\User',
    defaultViewport: null
};
class AllCssCoverage {
    text: string;
    rangesList: Array<{ start: number; end: number }>[] = [];
    constructor(coverageEntry: puppeteer.CoverageEntry) {
        this.text = coverageEntry.text;
        this.rangesList.push(coverageEntry.ranges);
    }
    add(coverageEntry: puppeteer.CoverageEntry) {
        if (this.text === coverageEntry.text) {
            this.rangesList.push(coverageEntry.ranges);
        } else {
            console.error('url or text nor match');
        }
    }
}

class UnusedCss {
    config = {
       
    };

    cssNeedToExtract: string[] = [''];
    AllCoverageEntryList = {};
    generateFile() {
        let fileName = `./export/unusedCss/${this.config.fileName}.css`;
        let final_css_bytes = '';
        let total_bytes = 0;
        let used_bytes = 0;
        Object.keys(this.AllCoverageEntryList).forEach(key => {
            const entry = this.AllCoverageEntryList[key];
            total_bytes += entry.text.length;
            for (const range of entry.mergedRangeList) {
                used_bytes += range.end - range.start - 1;
                final_css_bytes += entry.text.slice(range.start, range.end) + '\n';
            }
        });
        if (!fs.existsSync('./output/unusedCss')) {
            fs.mkdirSync('./output/unusedCss', { recursive: true });
        }
        fs.writeFile(fileName, final_css_bytes, error => {
            if (error) {
                console.log('Error creating file:', error);
            } else {
                console.log('File saved');
            }
        });
    }
    async run() {
        let browserOptions = {
            /*  args: [
                 '--ignore-certifcate-errors',
                 '--ignore-certifcate-errors-spki-list',
                 '--enable-remote-extensions',
                 '--user-data-dir'
             ], */
            headless: false,
            defaultViewport: null
        };
        const browser = await puppeteer.launch(browserOptions);
        const eachPageProcedure = async (url: string, cssList: string[], device: Devices.Device = Devices['iPhone 6']) => {
            const page = await browser.newPage();
            await page.emulate(device);
            await page.goto(url);
            await page.coverage.startCSSCoverage();
            const css_coverage: puppeteer.CoverageEntry[] = await page.coverage.stopCSSCoverage();
            await delay(10000);
            /*    let report = util.inspect(css_coverage, {
                showHidden: false,
                depth: null
            }); */
            css_coverage.forEach(coverageEntry => {
                if (
                    cssList.some(cssFileWildCard => {
                        const result = micromatch.isMatch(new URL(coverageEntry.url).pathname, cssFileWildCard);
                        if (result) {
                            console.log('\x1b[36m%s\x1b[0m', 'find Css file in list:', coverageEntry.url, cssFileWildCard);
                        }
                        return result;
                    })
                ) {
                    if (this.AllCoverageEntryList) {
                        if (this.AllCoverageEntryList[coverageEntry.url] === undefined) {
                            this.AllCoverageEntryList[coverageEntry.url] = new AllCssCoverage(coverageEntry);
                        } else {
                            this.AllCoverageEntryList[coverageEntry.url].add(coverageEntry);
                        }
                    }
                }
            });

            await page.close();
        };

        await asyncForEach(this.config.pageUrlList, async pageUrl => {
            await eachPageProcedure(pageUrl, this.config.cssList);
        });
        console.log(this.AllCoverageEntryList);
        console.log('done');

        // start to merge the rangList for each css file into one.
        Object.keys(this.AllCoverageEntryList).forEach(key => {
            this.AllCoverageEntryList[key].mergedRangeList = mergerRange(
                this.AllCoverageEntryList[key].rangesList,
                this.AllCoverageEntryList[key].text.length
            );
        });
        console.log(this.AllCoverageEntryList);
        console.log('after merge', this.AllCoverageEntryList);
        this.generateFile();
        browser.close();
    }
}
//4294967296
const unUsedCss = new UnusedCss();
unUsedCss.run();
