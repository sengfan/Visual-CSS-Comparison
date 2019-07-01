/*
 * @Author: Zhou Fang
 * @Date: 2019-06-29 15:21:32
 * @Last Modified by:   Zhou Fang
 * @Last Modified time: 2019-06-29 15:21:32
 */

            var lazyCssPromise = (function(length) {
                function defer() {
                    var self = this;
                    self.promise = new Promise((resolve, reject) => {
                        self.resolve = resolve;
                        self.reject = reject;
                    });
                    return self;
                }
            
                var lazyCssPromisees = new Array(length).fill().map(function() {
                    return new defer();
                });
                Promise.all(
                    lazyCssPromisees.map(function(deferItem) {
                        return deferItem.promise;
                    })
                ).then(function(cssTags) {
                    console.log('solove')
                   var cssBag = document.createDocumentFragment();
                   cssTags.forEach(function(cssTag){
                    cssBag.appendChild(cssTag);
                   });
            
                   document.querySelector('#lazyInlineCss').insertAdjacentElement('afterend', cssBag);
            
                });
                return lazyCssPromisees;
            })(3);

            lazyCssPromise.forEach(item=>item.resolve(true));


/* 

<link rel="stylesheet" href="/bundles/Styles/common.xs.css?v=gO5SWaHFtivd2cPvUjGf1qcZN6Dc1aBbTfBwsTtRb7s1" as="style" onload="this.onload=null;this.rel='stylesheet'
                                                                                                                            window.test = this;
                                                                                                                            console.log(this);
                                                                                                                            alert(123); 
                                                                        console.log(this)                                                      " data-fallback="true"></link> */
