// ==UserScript==
// @name         DoubleLing(Mostly Reach It)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://joucks.cn:3344/
// @grant        none
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    let oldSetInternal = setInterval
    setInterval = function(callback, time) {
        if (callback.toString().indexOf('eleId') !== -1) {
            let cb = function() {
                fetch("http://joucks.cn:3344/api/getGoodsBySystem", {
                    "credentials":"include",
                    "headers":{
                        "accept":"*/*",
                        "accept-language":"zh-CN,zh;q=0.9",
                        "if-none-match":"W/\"26-smPiC8LcNdm+TeCFbsoU2GWoVnc\"",
                        "x-requested-with":"XMLHttpRequest"
                    },
                    "referrer":"http://joucks.cn:3344/",
                    "referrerPolicy":"no-referrer-when-downgrade",
                    "body":null,
                    "method":"GET",
                    "mode":"cors"
                });
            }
            return oldSetInternal(function() {
                let eleId = '#goods' + userCache._id
                var num = parseInt($(eleId).text())
                $(eleId).text(num + 1)
                if ((num + 1) > 60) {
                    cb();
                    cb();
                    cb();
                    $(eleId).text(0)
                }
            }, time)
        } else {
            return oldSetInternal(callback, time)
        }
    }
})();
