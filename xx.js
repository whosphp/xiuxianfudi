// ==UserScript==
// @name         修仙福地
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        http://joucks.cn:3344/
// @updateURL    https://raw.githubusercontent.com/whosphp/xiuxianfudi/master/xx.js
// @downloadURL  https://raw.githubusercontent.com/whosphp/xiuxianfudi/master/xx.js
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@9
// @require      https://cdn.jsdelivr.net/npm/vue/dist/vue.js
// ==/UserScript==

(function() {
    'use strict';

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let old = scoketConntionTeam;
    let connectFlag = true;
    scoketConntionTeam = function () {
        if (connectFlag) {
            connectFlag = false
        } else {
            return
        }

        let interval = setInterval(function () {
            if (socket === undefined || ! socket) {
                old()
            } else if (socket.connected) {
                socket.off('disconnect')
                socket.on('disconnect', function() {
                    console.warn('disconnect')
                    who_notify('disconnect')
                })

                socket.on("team",function(res) {
                    let type = res.type
                    switch (type) {
                        case "currentTeamDisband":
                            who_notify('队伍解散')
                            break;
                    }
                })

                clearInterval(interval)
            }
        }, 1000)

        console.debug('scoketConntionTeam called')
    }

    $('.container-fluid > .homediv > div:first-child').append(`
<div id="who_helper">
<table class="table table-condensed">
    <tr v-for="sub in subscribes">
        <td><input type="checkbox" :checked="sub.checked" @click="sub.checked = ! sub.checked"></td>
        <td>{{ sub.goodsName }}</td>
        <td>{{ sub.goodsNum }}</td>
    <tr>
</table>
</div>
`)

    unsafeWindow.who_app = new Vue({
        'el': '#who_helper',
        data: {
            who_userBaseInfo: {
                'max-vitality-num': 500,
                'max-energy-num': 300
            },
            subscribes: [
                {
                    checked: true,
                    goodsName: '蚊针',
                    goodsNum: 10
                },
                {
                    checked: true,
                    goodsName: '蜥血',
                    goodsNum: 150
                }
            ]
        }
    })

    var host = 'http://xx.gl.test:9102'

    function who_log_success (msg) {
        console.debug('%c'+msg, 'color: green; font-size: 16px;')
    }

    function send_to_local (data) {
        let a = new FormData();
        a.append('data', JSON.stringify(data))

        GM_xmlhttpRequest({
            method: "POST",
            url: host+"/api/log",
            data: a,
            onload: function(response) {
                console.log(response)
            }
        })
    }

    function who_notify (msg) {
        GM_xmlhttpRequest({
            method: "GET",
            url: host+"/notify?msg="+msg,
            onload: function(response) {
                console.log(response)
            }
        })
    }

    function who_check_goods (datum, subscribe) {
        if (datum.goods && datum.goods.name == subscribe.goodsName && datum.count >= subscribe.goodsNum) {
            return true;
        }

        return false;
    }

    // $('#goods-list .goods-sub span').append('<a onclick="who_subcribe">subcribe</a>')

    $(document).ajaxComplete(function(event, xhr, settings) {
        if (settings.url.startsWith("/api/getSellGoods")) {
            console.debug('fetch getSellGoods')

            xhr.responseJSON.data.playerSellUser.map(user => {
                if (user.goods && user.goods.name == '技-出云幻星' && user.game_gold / user.count <= 300) {
                    console.debug(user)
                    console.debug('goods_id: ' + user._id)
                    // bySellGoodsFunc(user._id)
                    alert('lower price goods found')
                }
            })
        }

        if (settings.url.startsWith("/api/getUserGoods")) {
            console.debug('fetch getUserGoods')

            xhr.responseJSON.data.map(datum => {
                who_app.subscribes.map(sub => {
                    if (sub.checked && who_check_goods(datum, sub)) {
                        who_log_success(sub.goodsName + '数量达成目标')
                        who_notify(sub.goodsName + '数量达成目标')
                        sub.checked = false;
                    }
                })
            })
        }

        if (settings.url.startsWith("/api/getUserInfo")) {
            console.debug('fetch getUserInfo')

            let user = xhr.responseJSON.data.user
            if (user.repair_num > user.next_level_num) {
                upgradeUserLevelFunc()
                who_notify('level up to '+ (user.level + 1))
            }

            // 定时制作物品 消耗精力 防止精力爆炸
            if (user.vitality_num >= who_app.who_userBaseInfo['max-vitality-num']) {
                makeLifeGoodsFunc(1)
            }

            if (user.energy_num >= who_app.who_userBaseInfo['max-energy-num']) {
                makeLifeGoodsFunc(2)
            }
        }
    })

    // 进入组队大厅
    $('#fishfarm').click()
    $('#fish-game-btn-c').click()

    // 定时更新用户信息
    setInterval(function() { getUserInfoFunc() }, 300000)
})();