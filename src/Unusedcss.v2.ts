/*
 * @Author: Zhou Fang
 * @Date: 2019-06-28 15:51:36
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-07-01 00:16:50
 */

import * as puppeteer from 'puppeteer';
import * as Devices from 'puppeteer/DeviceDescriptors';
import * as micromatch from 'micromatch';
import { WildCardReplaceRequests } from './model/WildCardReplaceRequests';
import { defer } from 'rxjs';
import { Config } from './model/Config';
import * as moment from 'moment';
import * as fs from 'fs';
import 'ts-polyfill/lib/es2019-array';

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
class AllCssCoverage {}

class UnusedCss {
    browser;
    AllCssCoverage = [];
    async eachPage(url: string, cssList: string[]) {
        this.browser = await puppeteer.launch(browserOptions);
        const page = await this.browser.newPage();
        await page.coverage.startCSSCoverage();
        const css_coverage: puppeteer.CoverageEntry[] = await page.coverage.stopCSSCoverage();
        let report = util.inspect(css_coverage, {
            showHidden: false,
            depth: null
        });

        css_coverage.forEach(item => {
            if (
                cssList.some(cssFileWildCard => {
                    micromatch.isMatch(item.url, cssFileWildCard);
                })
            ) {
                if (this.AllCssCoverage) {
                    if (this.AllCssCoverage[item.url] === undefined) {
                    }
                }
            }
        });
    }
}
//4294967296
