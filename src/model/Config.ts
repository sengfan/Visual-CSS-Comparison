import { UrlList } from './UrlList';

export class Config {
    constructor(
        public urlLists: UrlList[],
        public mockDevice?: string[],
        public compare = true,
        public allPhoto = true,
        public fileSavePath = './'
    ) {}
}
