/*
 * @Author: Zhou Fang
 * @Date: 2019-06-28 15:51:36
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-08-02 11:47:20
 */

import * as puppeteer from 'puppeteer';
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
(async () => {
    try {
        const browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();
        await page.coverage.startCSSCoverage();
        await page.goto('https://qa-www.crateandbarrel.com/search?query=book');
        const css_coverage:puppeteer.CoverageEntry[] = await page.coverage.stopCSSCoverage();
        let report = util.inspect(css_coverage, {
            showHidden: false,
            depth: null
        });
        console.log(report);
        let final_css_bytes = '';
        let total_bytes = 0;
        let used_bytes = 0;

        for (const entry of css_coverage) {
            total_bytes += entry.text.length;
            for (const range of entry.ranges) {
                used_bytes += range.end - range.start - 1;
                final_css_bytes +=
                    entry.text.slice(range.start, range.end) + '\n';
            }
        }
        fs.writeFile('./report.json', report, error => {
            if (error) {
                console.log('Error creating report:', error);
            } else {
                console.log('report saved');
            }
        });

        fs.writeFile('./final_css.css', final_css_bytes, error => {
            if (error) {
                console.log('Error creating file:', error);
            } else {
                console.log('File saved');
            }
        });
        //    await browser.close();
    } catch (e) {
        console.log(e);
    }
})();

//4294967296
