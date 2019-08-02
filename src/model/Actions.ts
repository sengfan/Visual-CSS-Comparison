/*
 * @Author: Zhou Fang
 * @Date: 2019-07-20 21:06:56
 * @Last Modified by:   Zhou Fang
 * @Last Modified time: 2019-08-01 10:06:56
 */
import { defer, merge, of } from 'rxjs';
import { Page, ElementHandle } from 'puppeteer';
import { XhrWatcher } from '../../src/model/XhrWatcher';
import {
    ObjectToArray,
    asyncForEach,
    delay,
    allFocusAbleChild
} from './helper';
import { async } from 'rxjs/internal/scheduler/async';
import { ActionMethod } from './ActionMethod';
import { Selectors, Action } from '../interface';
class SimpleStep {
    constructor(
        public selector: string,
        public actionMethod: ActionMethod,
        public pageNavigation = false,
        public queryAll = false,
        public followSteps?: StepSequence
    ) {}
}
class HoverStep extends SimpleStep {
    constructor(public selector: string, public followSteps?: StepSequence) {
        super(selector, ActionMethod.hover);
    }
}
class ClickStep extends SimpleStep {
    constructor(
        public selector: string,
        public pageNavigation = false,
        public queryAll = false,
        public followSteps?: StepSequence
    ) {
        super(selector, ActionMethod.click, pageNavigation, queryAll);
    }
}
class TapStep extends SimpleStep {
    constructor(
        public selector: string,
        public pageNavigation = false,
        public queryAll = false,
        public followSteps?: StepSequence
    ) {
        super(selector, ActionMethod.tap, pageNavigation, queryAll);
    }
}

class FocusStep extends SimpleStep {
    constructor(
        public selector: string,
        public queryAll = false,
        public followSteps?: StepSequence
    ) {
        super(selector, ActionMethod.focus, false, queryAll);
    }
}
class TypeStep extends SimpleStep {
    constructor(
        public selector: string,
        public value = '',
        public delay = 100,
        public preCleanEntry = true
    ) {
        super(selector, ActionMethod.type);
    }
}

type StepSequence = Map<
    string,
    SimpleStep | HoverStep | ClickStep | FocusStep | TypeStep
>;


export class Actions {
    hoverSelectors: Selectors = {};
    focusSelectors: string[] = [];

    customizedScript: (() => Promise<any>)[] = [];

    stepSequencesActions: StepSequence[] = [];
    stepSequencesMobileActions: StepSequence[] = [];
    timeOut: 1000;
    option: {
        page: Page;
        xhrWatcher: XhrWatcher;
        mergeCssCoverage: (keepGoing?: Boolean) => Promise<void>;
        isMobile?;
    };
    constructor() {}
    add(keyName: string, item: string | Promise<any>) {
        if (this[keyName] && Array.isArray(this[keyName])) {
            this[keyName].push(item);
        }
    }
    setOption(option: {
        page: Page;
        xhrWatcher: XhrWatcher;
        mergeCssCoverage: (keepGoing?: Boolean) => Promise<void>;
        isMobile?: boolean;
    }) {
        this.option = option;
    }

    getActions$(page: Page) {
        const eachAction = async (
            item: string | (() => Promise<any>),
            asyncMethod,
            timeout: number = 1000
        ) => {
            if (
                asyncMethod !== 'customizedScript' &&
                item &&
                typeof item === 'string'
            ) {
                if (page[asyncMethod]) {
                    await page.waitForSelector(item, {
                        timeout: timeout
                    });
                    await page[asyncMethod](<string>item);
                } else {
                    console.error(`${asyncMethod} asyncMethod is not exit`);
                }
            } else {
                await (<(() => Promise<any>)>item)();
            }
        };

        const hoverActions = ObjectToArray(this.hoverSelectors).map(
            selector => {
                return defer(() => {
                    eachAction(selector, 'hover', this.timeOut);
                });
            }
        );
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

    static getHFCActions(
        selectors: Selectors,
        ActionMethod:
            | ActionMethod.click
            | ActionMethod.focus
            | ActionMethod.hover
            | ActionMethod.tap,
        option: {
            page: Page;
            xhrWatcher: XhrWatcher;
        }
    ) {
        const { page, xhrWatcher } = option;
        return ObjectToArray(selectors).map(selector => {
            return async () => {
                await xhrWatcher.waitForNetworkIdle();
                // make sure at least one selector has been rendered out
                const hasRendered = await page.waitForSelector(selector, {
                    timeout: 1000
                });
                if (hasRendered) {
                    const allElement: ElementHandle[] = await page.$$(selector);
                    if (allElement.length > 0) {
                        await asyncForEach(
                            allElement,
                            async (element: ElementHandle) => {
                                try {
                                    await xhrWatcher.waitForNetworkIdle();
                                    if (element[ActionMethod]) {
                                        const visible = await element.boundingBox();
                                        if (visible) {
                                            await element[ActionMethod]();
                                        }
                                    }
                                } catch (error) {
                                    console.error(error, element.asElement());
                                }

                                await delay(300);
                            }
                        );
                    }
                } else {
                    console.error(`selector ${selector} not exit on this page`);
                }
            };
        });
    }
    static async runStepSequenceAction(
        stepSequence: StepSequence,
        option: {
            page: Page;
            xhrWatcher: XhrWatcher;
            mergeCssCoverage: (keepGoing?: Boolean) => Promise<void>;
            isMobile?: boolean;
        }
    ) {
        const { page, xhrWatcher, mergeCssCoverage, isMobile } = option;

        const noInputAction = async (
            selector: string,
            ActionMethod,
            pageNavigation = false,
            queryAll = false,
            followSteps: StepSequence
        ) => {
            const handleEachItem = async (element: ElementHandle) => {
                try {
                    await xhrWatcher.waitForNetworkIdle();
                    if (element[ActionMethod]) {
                        const visible = await element.boundingBox();
                        if (visible) {
                            try {
                                await element.focus();

                                if (
                                    !isMobile &&
                                    visible.width !== 0 &&
                                    visible.height !== 0
                                ) {
                                    await element.hover();
                                }
                            } catch (error) {
                                const className = await element
                                    .asElement()
                                    .getProperty('className');
                                await element.focus();
                                console.log('focus ok');
                                await element.hover();
                                console.log('hover ok');
                                console.error(error, className);
                                throw error;
                            }

                            if (pageNavigation) {
                                await mergeCssCoverage();
                                await Promise.all([
                                    page.waitForNavigation(), // The promise resolves after navigation has finished
                                    element[ActionMethod]()
                                ]);
                            } else {
                                await element[ActionMethod]();
                            }
                            if (followSteps) {
                                await Actions.runStepSequenceAction(
                                    followSteps,
                                    option
                                );
                            }
                        }
                    }
                } catch (error) {
                    const className = await element
                        .asElement()
                        .getProperty('className');
                    console.error(error, className);
                    throw error;
                }

                //  await delay(100);
            };
            await xhrWatcher.waitForNetworkIdle();
            console.log('net work idle');
            // make sure at least one selector has been rendered out
            const hasRendered = await page.waitForSelector(selector, {
                timeout: 1000
            });
            if (hasRendered) {
                try {
                    if (queryAll) {
                        const allElement: ElementHandle[] = await page.$$(
                            selector
                        );
                        if (allElement.length > 0) {
                            await asyncForEach(allElement, handleEachItem);
                        }
                    } else {
                        const element = await page.$(selector);
                        await handleEachItem(element);
                    }
                } catch (error) {
                    console.error(selector, error);
                }
            } else {
                console.error(`selector ${selector} not exit on this page`);
            }
        };

        for (let [key, step] of stepSequence) {
            if (
                step.actionMethod === ActionMethod.click ||
                step.actionMethod === ActionMethod.hover ||
                step.actionMethod === ActionMethod.focus ||
                step.actionMethod === ActionMethod.tap
            ) {
                try {
                    await noInputAction(
                        step.selector,
                        step.actionMethod,
                        step.pageNavigation,
                        step.queryAll,
                        step.followSteps
                    );
                    console.log(`step ${key} processed `);
                } catch (error) {
                    console.error(`step ${key} error`);
                    console.error(error);
                }
            } else if ((<TypeStep>step).actionMethod === ActionMethod.type) {
                const { selector, value, delay, preCleanEntry } = <TypeStep>(
                    step
                );
                await xhrWatcher.waitForNetworkIdle();
                await page.waitForSelector(selector);
                if (preCleanEntry) {
                    await page.click(selector, { clickCount: 3 });
                    await page.keyboard.press('Backspace');
                }
                await page.keyboard.type(value, {
                    delay: delay
                });
            }
        }
    }

    getHFCActions() {
        if (!this.option) {
            console.error('option for this Action need to be set');
            return;
        }
        return Actions.getHFCActions(
            this.hoverSelectors,
            ActionMethod.hover,
            this.option
        );
    }

    async runStepSequenceActions(mobile?) {
        let stepSequencesActions;
        if (mobile) {
            stepSequencesActions = this.stepSequencesMobileActions;
        } else {
            stepSequencesActions = this.stepSequencesActions;
        }
        await asyncForEach(stepSequencesActions, async stepSequence => {
            await Actions.runStepSequenceAction(stepSequence, this.option);
        });
        console.log('StepSequenceActions finished');
    }
}

const HoverSelectors = {};

const ClickSelectors = {};

// new way to organize
const desktopHeaderMenuAction: Action = {
    device: 'desktop',
    type: ActionMethod.hover,
    selector: {
        topMenuSelector: '#js-main-navigation > .js-nav-main > li.js-nav-super',

        account: 'div > #header-account-signed-out-link',
        fav: '#js-favorites-hover',
        cart: '#js-cart-navigation'
    }
};

const desktopHeaderStoreAction = {
    type: ActionMethod.click,
    selector: {
        'find your store': '#js-header-store > a.header-store-link-name',
        'expand store tab':
            '#global-popup #popup-content #storeLocationListDetail .form-button-icon',
        'change Store':
            '#storeDisplayDetail > div:nth-child(2) > div.nearby-title-wrapper > button'
    }
};

const desktopHeaderStoreStepSequences: StepSequence = new Map()
    .set(
        'find your store',
        new ClickStep('#js-header-store > a.header-store-link-name')
    )
    .set(
        'expand store tab',
        new ClickStep(
            '#global-popup #popup-content #storeLocationListDetail .form-button-icon'
        )
    )
    .set(
        'change Store',
        new ClickStep(
            '#storeDisplayDetail > div:nth-child(2) > div.nearby-title-wrapper > button',
            true
        )
    )
    .set(
        'Hover store in header again',
        new HoverStep('#js-header-store > ul > li > .header-store-link-name')
    )
    .set(
        'bring store pop up',
        new ClickStep('#header-store-details #header-store-see-more-link')
    )
    .set(
        'change zip Code',
        new TypeStep(
            '#global-popup #popup-content #ZipCode',
            '00000',
            100,
            true
        )
    )
    .set(
        'submit Zip code',
        new ClickStep('#formContent > div.form-stores-nearby > button')
    )
    .set('close Store popup', new ClickStep('#popup-close'));

const desktopSearchFilterSequences = new Map().set(
    'find your store',
    new ClickStep('#js-header-store > a.header-store-link-name')
);

const focusAction = new Map().set(
    'all focusAction',
    new FocusStep(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        true
    )
);
const filterAction = new Map().set(
    'open dropDown',
    new ClickStep(
        '#search-filters .dropdown',
        false,
        true,
        new Map()
            .set(
                'click check box',
                new ClickStep('#search-filters .dropdown .filter-list li label')
            )
            .set(
                'focus all',
                new FocusStep(
                    allFocusAbleChild('#search-filters .dropdown'),
                    true
                )
            )
    )
);

const favAction = new Map()
    .set(
        'click fav',
        new ClickStep(
            'div.product-details-wrapper .product-info button .icon.svg-icon-heart-outline',
            false,
            false,
            new Map().set(
                'focus all in pop up',
                new FocusStep(allFocusAbleChild('#global-popup'), true)
            )
        )
    )
    .set(
        'add fav',
        new ClickStep('#global-popup .select-list-wrap a.design-list')
    )
    .set(
        'click fav again',
        new ClickStep(
            'div.product-details-wrapper .product-info button .icon.svg-icon-heart-outline'
        )
    )
    .set('close Store popup', new ClickStep('#popup-close'));

export const testAction = new Actions();
testAction.hoverSelectors = desktopHeaderMenuAction.selector;

testAction.stepSequencesActions.push(
    // testActions
    favAction,
    filterAction,
    focusAction,
    desktopHeaderStoreStepSequences
);

const mobileHeaderAction: StepSequence = new Map()
    .set(
        'click menu',
        new TapStep(
            '#menu-button > button',
            false,
            false,
            new Map().set(
                'focus all in pop up',
                new FocusStep(allFocusAbleChild('#main-menu-container'), true)
            )
        )
    )
    .set(
        'open sub menu',
        new TapStep(
            '#primary-navigation-items > li:nth-child(1) > button',
            false,
            false,
            new Map().set(
                'focus all in pop up',
                new FocusStep(
                    allFocusAbleChild('.child-menu.is-expanded'),
                    true
                )
            )
        )
    )
    .set(
        'open Kid',
        new ClickStep(
            '#main-menu-container > div.menu-tabs > div.menu-tab.kids-tab > button',
            false
        )
    );
const mobileFilterAction = new Map().set(
    'open popup',
    new ClickStep(
        '.filter-layout-options > div.sort-and-filter.jsFilterTestA',
        false,
        false,
        new Map()
            .set('click sort by', new ClickStep('#selSortBy'))
            .set(
                'open tab',
                new ClickStep('#popup-content .filter-container.panel')
            )
            .set(
                'focus all',
                new FocusStep(allFocusAbleChild('#popup-content'), true)
            )
            .set(
                'close',
                new ClickStep('#popup-content .popup-close.js-popup-close')
            )
    )
);
const mobileFavAction = new Map()
    .set(
        'click fav',
        new ClickStep(
            'div.product-details-wrapper .product-info button .icon.svg-icon-heart-outline',
            false,
            false,
            new Map().set(
                'focus all in pop up',
                new FocusStep(allFocusAbleChild('#global-popup'), true)
            )
        )
    )
    .set(
        'add fav',
        new ClickStep('#global-popup .select-list-wrap a.design-list')
    )
    .set(
        'click fav again',
        new ClickStep(
            'div.product-details-wrapper .product-info button .icon.svg-icon-heart-outline'
        )
    )
    .set('close Store popup', new ClickStep('#popup-close'));

testAction.stepSequencesMobileActions.push(
    focusAction,
    mobileFavAction,
    mobileFilterAction,
    mobileHeaderAction
);
//#primary-kids-navigation-items > li:nth-child(1)
