

export class WildCardReplaceRequests {
   /**
    *Creates an instance of WildCardReplaceRequests.
    * @date 2019-06-24
    * @param {string[]} [redirectURLs]
    * @param {string} [redirectDomain]
    * @param {string[]} [abortURLs]
    * @memberof WildCardReplaceRequests
    */
   constructor(
        public redirectURLs?: string[],
        public redirectDomain?: string,
        public abortURLs?: string[]
    ) {}
}
