import { Config } from '../src/model/Config';
import { UrlList } from '../src/model/UrlList';
import { WildCardReplaceRequests } from '../src/model/WildCardReplaceRequests';

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
        redirectURLs: searchAreaCssList,
        redirectDomain: 'http://trunk-www.crateandbarrel.com'
    }
};
export const config = new Config([urlList]);
