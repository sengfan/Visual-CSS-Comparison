/*
 * @Author: Zhou Fang
 * @Date: 2019-06-28 15:51:36
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-08-01 09:12:29
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
import { typeAheadAction } from '../example/actions/common.actions';
import {
    config,
    searchAreaPageUrlList,
    searchAreaCssList,
    spillAreaHousewaresPageUrlList,
    spillAreaCssList
} from '../example/config';
import { mergerRange } from './model/merge';
import { XhrWatcher } from './model/xhrWatcher';
import { asyncForEach, delay } from './model/helper';
import { testAction } from './model/Actions';

const util = require('util');

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
        pageUrlList: searchAreaPageUrlList,
        cssList: searchAreaCssList,
        fileName: 'crate-xs-us-qa'
    };
    actionFinished = false;
    cssNeedToExtract: string[] = [''];
    AllCoverageEntryList = {};
    generateCssFile() {
        let fileName = `./export/unusedCss/${this.config.fileName}.css`;
        let final_css_bytes = '';
        let total_bytes = 0;
        let used_bytes = 0;
        Object.keys(this.AllCoverageEntryList).forEach(key => {
            const entry = this.AllCoverageEntryList[key];
            total_bytes += entry.text.length;
            for (const range of entry.mergedRangeList) {
                used_bytes += range.end - range.start - 1;
                final_css_bytes +=
                    entry.text.slice(range.start, range.end) + '\n';
            }
        });

        final_css_bytes = final_css_bytes.replace(/\}{1,}/g, '}');
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
        const eachPageProcedure = async (
            url: string,
            cssList: string[],
            device: Devices.Device = Devices['iPhone 6']
        ) => {
            const page = await browser.newPage();
            const xhrWatcher = new XhrWatcher(page);

            if (device) {
                await page.emulate(device);
                await delay(1000);
            }
           
            await page.goto(url, {
                waitUntil: 'networkidle2'
            });
            const options: puppeteer.StartCoverageOptions = {
                resetOnNavigation: false
            };

            const cssCoverageHandle = await page.coverage.startCSSCoverage(
                options
            );
            let mergeCssCoverage = async (keepGoing: Boolean = true) => {
                const css_coverage: puppeteer.CoverageEntry[] = await page.coverage.stopCSSCoverage();
                css_coverage.forEach(coverageEntry => {
                    if (
                        cssList.some(cssFileWildCard => {
                            const result = micromatch.isMatch(
                                new URL(coverageEntry.url).pathname,
                                cssFileWildCard
                            );
                            if (result) {
                                console.log(
                                    '\x1b[36m%s\x1b[0m',
                                    'find Css file in list:',
                                    coverageEntry.url,
                                    cssFileWildCard
                                );
                            }
                            return result;
                        })
                    ) {
                        console.log(
                            'AllCoverageEntryList',
                            this.AllCoverageEntryList
                        );
                        if (this.AllCoverageEntryList) {
                            if (
                                this.AllCoverageEntryList[coverageEntry.url] ===
                                undefined
                            ) {
                                this.AllCoverageEntryList[
                                    coverageEntry.url
                                ] = new AllCssCoverage(coverageEntry);
                            } else {
                                this.AllCoverageEntryList[
                                    coverageEntry.url
                                ].add(coverageEntry);
                            }
                        }
                    }
                });

                if (keepGoing) {
                    await page.coverage.startCSSCoverage(options);
                }
            };
             mergeCssCoverage = mergeCssCoverage.bind(this);
            console.log(cssCoverageHandle);
            await delay(2000);
            await xhrWatcher.waitForNetworkIdle();
            await page.mouse.click(0, 0);
            testAction.setOption({
                page,
                xhrWatcher,
                mergeCssCoverage,
                isMobile:true
            });
            /* const allSimpleActions =  testAction.getHFCActions();
            await asyncForEach(allSimpleActions, async eachProgress => {
                console.log(eachProgress);
                await eachProgress();
            });
            await typeAheadAction({
                page,
                xhrWatcher
            }); */

            if (!this.actionFinished) {
                 await typeAheadAction({
                    page,
                    xhrWatcher,
                    mergeCssCoverage,
                    mobile:true
                }); 
               /*  const allSimpleActions = testAction.getHFCActions();
                await asyncForEach(allSimpleActions, async eachProgress => {
                    console.log(eachProgress);
                    await eachProgress();
                }); */

                await testAction.runStepSequenceActions(true);
                this.actionFinished = true;
            }

            //  const css_coverage: puppeteer.CoverageEntry[] = await page.coverage.stopCSSCoverage();

            /*    let report = util.inspect(css_coverage, {
                showHidden: false,
                depth: null
            }); */

            await mergeCssCoverage(false);
            /*   css_coverage.forEach(coverageEntry => {
                if (
                    cssList.some(cssFileWildCard => {
                        const result = micromatch.isMatch(
                            new URL(coverageEntry.url).pathname,
                            cssFileWildCard
                        );
                        if (result) {
                            console.log(
                                '\x1b[36m%s\x1b[0m',
                                'find Css file in list:',
                                coverageEntry.url,
                                cssFileWildCard
                            );
                        }
                        return result;
                    })
                ) {
                    if (this.AllCoverageEntryList) {
                        if (
                            this.AllCoverageEntryList[coverageEntry.url] ===
                            undefined
                        ) {
                            this.AllCoverageEntryList[
                                coverageEntry.url
                            ] = new AllCssCoverage(coverageEntry);
                        } else {
                            this.AllCoverageEntryList[coverageEntry.url].add(
                                coverageEntry
                            );
                        }
                    }
                }
            });
 */
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
        this.generateCssFile();
        browser.close();
    }
}
//4294967296
const unUsedCss = new UnusedCss();
unUsedCss.run();
