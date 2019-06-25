import { UrlList } from './UrlList';

export class Config {
    constructor(public urlLists: UrlList[], public compare = true, public allPhoto = true) {}
}
