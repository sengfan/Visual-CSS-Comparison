/*
 * @Author: Zhou Fang
 * @Date: 2019-06-28 15:51:36
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-06-28 21:04:31
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



(async () => {
 const browser = await puppeteer.launch();
 const page = await browser.newPage();
 await page.coverage.startCSSCoverage();
 await page.goto('https://qa-www.crateandbarrel.com/search?query=book');
 const css_coverage = await page.coverage.stopCSSCoverage();
 let report = util.inspect(css_coverage, { showHidden: false, depth: null })
 console.log(report);
 let final_css_bytes = '';
let total_bytes = 0;
let used_bytes = 0;

for (const entry of css_coverage) {
  total_bytes += entry.text.length;
  for (const range of entry.ranges) {
    used_bytes += range.end - range.start - 1;
    final_css_bytes += entry.text.slice(range.start, range.end) + '\n';
  }
}
fs.writeFile('./report.json',report)


fs.writeFile('./final_css.css', final_css_bytes, error => {
  if (error) {
    console.log('Error creating file:', error);
  } else {
    console.log('File saved');
  }
});
 await browser.close();
})();



