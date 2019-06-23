/*
 * @Author: Zhou Fang
 * @Date: 2019-06-21 15:38:57
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-06-21 16:04:57
 */
import * as puppeteer from 'puppeteer';
import * as micromatch from 'micromatch';
const urlList: string[] = [];
re


const proxyFilter = (url: string): boolean => {
    const urlList =;
};

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg')) interceptedRequest.abort();
        else interceptedRequest.continue();
    });
    await page.goto('https://example.com');

    
    await page.screenshot({ path: 'example.png' });
    await browser.close();
})();
