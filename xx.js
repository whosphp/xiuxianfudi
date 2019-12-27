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
                        case "msg":
                            if (res.msg.includes('已达上限')) {
                                who_notify(res.msg)
                            }
                            break;
                        case "currentTeamDisband":
                            delete who_teams[res.data]
                            who_notify('队伍解散')
                            break;
                        case "listTeamDisband":
                            if (typeof res.data == "string") {
                                delete who_teams[res.data]
                            } else {
                                delete who_teams[res.data.teamId]
                            }
                            break;
                    }
                })

                clearInterval(interval)
            }
        }, 1000)

        console.debug('scoketConntionTeam called')
    }

    unsafeWindow.who_teams = {}
    let oldTeamReload = teamReload
    teamReload = function(obj, type) {
        oldTeamReload(obj, type)

        if (type == 1) { // 初始队伍列表
            for (const item of obj.data) {
                who_teams[item.teamId] = item
            }
            console.debug('team init')
        } else if (type == 2) { // 创建队伍反馈
            who_teams[obj.data.teamId] = obj.data
            console.debug('team added')
            console.debug(obj.data)
        } else if (type == 3) { // 刷新我得队伍
            who_teams[obj.data.teamId] = obj.data
            console.debug('team refresh')
            console.debug(obj.data)
        }
    }

    $('.container-fluid > .homediv > div:first-child').append(`
<div id="who_helper">
<form class="form-horizontal">
    <div class="form-group">
        <label class="col-sm-4 control-label">名称</label>
        <div class="col-sm-8">
            <input class="form-control" v-model="form.goodsName" type="text">
        </div>
    </div>
    <div class="form-group">
        <label class="col-sm-4 control-label">数量</label>
        <div class="col-sm-8">
            <input class="form-control" v-model="form.goodsNum" type="number">
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-4 col-sm-8">
            <button class="btn btn-success btn-sm" type="button" @click="addNewSub">新建</button>
        </div>
    </div>
</form>
<table class="table table-condensed">
    <tr v-for="sub in subscribes">
        <td><input type="checkbox" :checked="sub.checked" @click="sub.checked = ! sub.checked"></td>
        <td>{{ sub.goodsName }}</td>
        <td>{{ sub.goodsNum }}</td>
    <tr>
</table>
<form class="form-inline">
    <div class="form-group">
        <label>FB</label>
        <select class="form-control">
            <option v-for="option in fbOptions">{{ option.name }}</option>
        </select>
    </div>
    <button class="btn btn-success btn-sm" type="button" @click="autoApplyTeam">Auto Apply Team</button>
</form>
</div>
`)

    unsafeWindow.who_app = new Vue({
        'el': '#who_helper',
        data: {
            userGoodsPages: 1,// 背包物品总页数
            who_userBaseInfo: {
                'max-vitality-num': 500,
                'max-energy-num': 300
            },
            form: {
                goodsName: '',
                goodsNum: 1
            },
            fb: "密林",
            fbOptions: [],
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
        },
        methods: {
            autoApplyTeam() {
                console.log('auto apply team start...')
                if (! this.fb) { return; }

                let level = parseInt($('#current-level').text())
                console.log(level)

                for (let i = 4; i > 0; i--) {
                    for (const item of Object.values(who_teams)) {
                        if (item.scenesName == this.fb && ! item.is_pwd && item.level[0] < level && item.users.length == i) {
                            console.log(item)
                            applyTeamFunc(item.teamId, false)
                            return;
                        }
                    }
                }
            },
            addNewSub() {
                this.subscribes.push({
                    checked: true,
                    goodsName: this.form.goodsName,
                    goodsNum: this.form.goodsNum,
                })
            },
            getAllUserGoods() {
                for (let i = 1; i <= this.userGoodsPages; i++) {
                    $.get('/api/getUserGoods', { page: i })
                }
            }
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

            who_app.userGoodsPages = xhr.responseJSON.pages

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

        if (settings.url.startsWith("/api/getCombatBeMonster")) {
            who_app.fbOptions = xhr.responseJSON.data.combatList
        }
    })

    // 进入组队大厅
    $('#fishfarm').click()
    $('#fish-game-btn-c').click()

    setInterval(function() { getUserInfoFunc() }, 300000) // 定时更新用户信息
    setInterval(function() { who_app.getAllUserGoods() }, 60000) // 定时更新背包信息
})();