import { ActionMethod } from '../model/ActionMethod';

export interface Selectors {
    [key: string]: string;
}

export interface Action {
    device: string;
    type: ActionMethod;
    selector: Selectors;
}

