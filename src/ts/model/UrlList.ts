import { WildCardReplaceRequests } from './WildCardReplaceRequests';

export interface UrlList {
    url: string[];
    replaceRequests: WildCardReplaceRequests;
    executeScript?: string[];
}
