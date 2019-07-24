import { defer, merge, of } from 'rxjs';
import { Page } from 'puppeteer';
class Actions {
    hoverSelectors: string[] = [];
    focusSelectors: string[] = [];
    customizedScript: (() => Promise<any>)[] = [];
    timeOut: 1000;
    constructor(pageInstance) {}
    add(keyName: string, item: string | Promise<any>) {
        if (this[keyName] && Array.isArray(this[keyName])) {
            this[keyName].push(item);
        }
    }

    getActions(page: Page) {
        const eachAction = async (
            item: string | (() => Promise<any>),
            asyncMethod,
            timeout: number = 1000
        ) => {
            if (asyncMethod !== 'customizedScript' && item && typeof item === 'string') {
                if (page[asyncMethod]) {
                    await page.waitForSelector('selector', { timeout: timeout });
                    await page[asyncMethod](<string>item);
                } else {
                    console.error(`${asyncMethod} asyncMethod is not eixt`);
                }
            } else {
                await (<(() => Promise<any>)>item)();
            }
        };

        const hoverActions = this.hoverSelectors.map(selector => {
            return defer(() => {
                eachAction(selector, 'hover', this.timeOut);
            });
        });
        const focusActions = this.focusSelectors.map(selector => {
            return defer(() => {
                eachAction(selector, 'focus', this.timeOut);
            });
        });
        const customizedActions = this.customizedScript.map(script => {
            return defer(() => {
                eachAction(script, 'customizedScript', this.timeOut);
            });
        });
        return of([...hoverActions, ...focusActions, ...customizedActions]);
    }
}
