import { ElementHandle } from 'puppeteer';
import { Selectors } from '../interface';

export async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export const delay = ms => new Promise(res => setTimeout(res, ms));

export const ObjectToArray = (object: Selectors) => {
    return Object.keys(object).map(key => {
        return object[key];
    });
};

export const allChildSelector = (
    parentSelector: String,
    childSelector: string
) => {
    return childSelector
        .split(',')
        .map(selector => `${parentSelector.trim()} ${selector.trim()}`)
        .join(',');
};
export const allFocusAbleChild = (parentSelector: String) => {
    return allChildSelector(
        parentSelector,
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
};
