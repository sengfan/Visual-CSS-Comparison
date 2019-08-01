/*
 * @Author: Zhou Fang
 * @Date: 2019-07-25 12:02:25
 * @Last Modified by: Zhou Fang
 * @Last Modified time: 2019-07-25 12:53:36
 */

import { Request, Page } from 'puppeteer';

interface ResolvableRequest extends Request {
    resolver: () => void;
}
/**
 * @description Monitor network idle all the time
 * @Todo: need to update it to rxjs version
 * @class XhrWatcher
 */
export class XhrWatcher {
    page: Page;
    resourceType: string;
    pendingXhrs: Set<Request>;
    finishedWithSuccessXhrs: Set<Request>;
    finishedWithErrorsXhrs: Set<Request>;
    promisees: Array<Promise<void>>;

    constructor(page: Page) {
        this.promisees = [];
        this.page = page;
        this.resourceType = 'xhr';
        // page.setRequestInterception(true);
        this.pendingXhrs = new Set();
        this.finishedWithSuccessXhrs = new Set();
        this.finishedWithErrorsXhrs = new Set();
        page.on('request', (request: ResolvableRequest) => {
            if (request.resourceType() === this.resourceType) {
                this.pendingXhrs.add(request);
                this.promisees.push(
                    new Promise(resolve => {
                        request.resolver = resolve;
                    })
                );
            }
        });
        page.on('requestfailed', (request: ResolvableRequest) => {
            if (request.resourceType() === this.resourceType) {
                this.pendingXhrs.delete(request);
                this.finishedWithErrorsXhrs.add(request);
                if (request.resolver) {
                    request.resolver();
                    delete request.resolver;
                }
            }
        });
        page.on('requestfinished', (request: ResolvableRequest) => {
            if (request.resourceType() === this.resourceType) {
                this.pendingXhrs.delete(request);
                this.finishedWithSuccessXhrs.add(request);
                if (request.resolver) {
                    request.resolver();
                    delete request.resolver;
                }
            }
        });
    }

    async waitForNetworkIdle() {
        if (this.pendingXhrCount() === 0) {
            return;
        }
        await Promise.all(this.promisees);
    }

    pendingXhrCount() {
        return this.pendingXhrs.size;
    }
}
