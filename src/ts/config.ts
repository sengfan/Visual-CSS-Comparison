import { Config } from './model/Config';
import { UrlList } from './model/UrlList';
import { WildCardReplaceRequests } from './model/WildCardReplaceRequests';

const searchAreaCssList = [
    '/**/search.xs.css',
    '/**/search.md.css',
    '/**/common-spill.xs.css',
    '/**/common-spill.md.css',
    '/**/react-spill.xs.css',
    '/**/IdeasAndAdvice.css'
];

const urlList: UrlList = {
    url: ['http://www.crateandbarrel.com'],
    replaceRequests: {
        requestUrls: searchAreaCssList,
        redirectDomain: 'http://trunk-www.crateandbarrel.com'
    }
};
export const config = new Config([urlList]);
