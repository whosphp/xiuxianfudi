// ==UserScript==
// @name         修仙福地
// @namespace    http://tampermonkey.net/
// @version      0.6.6
// @description  try to take over the world!
// @author       You
// @match        http://joucks.cn:3344/
// @updateURL    https://raw.githubusercontent.com/whosphp/xiuxianfudi/master/xx.js
// @downloadURL  https://raw.githubusercontent.com/whosphp/xiuxianfudi/master/xx.js
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/npm/vue/dist/vue.js
// @run-at document-end
// ==/UserScript==
let who_interval = setInterval(function () {
    'use strict';

    let userId = $('#userId').val()
    let currentLevel = parseInt($('#current-level').text())
    if (!userId) {
        console.log('Can not find user id')
        return;
    }

    if (!currentLevel) {
        console.log('Can not get user level')
        return;
    }

    console.log(userId, currentLevel)
    clearInterval(who_interval)

    function getKey(key) {
        return userId + ':' + key
    }

    let roomIndex = GM_getValue(getKey('roomIndex'), 'unset')

    let old = scoketConntionTeam;
    scoketConntionTeam = function (index) {
        GM_setValue(getKey('roomIndex'), index)

        let interval = setInterval(function () {
            if (socket === undefined || !socket) {
                old(index)
            } else if (socket.connected) {
                socket.off('disconnect')
                socket.on('disconnect', function () {
                    who_log_warning('disconnect')
                    who_notify('disconnect', 1)
                })

                socket.on("team", function (res) {
                    let type = res.type
                    switch (type) {
                        case "msg":
                            if (res.msg.includes('已达上限')) {
                                who_notify(res.msg)
                            }
                            break;
                        case "currentTeamDisband":
                            who_app.amIINTeam = false
                            // 自己解散队伍时, 不发送通知
                            if (res.data !== $("#userId").val()) {
                                delete who_teams[res.data]
                                who_notify('队伍解散', 1)
                            }
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

                socket.on("battleEnd", function (res) {
                    who_app.teamBattleEndAt = moment()
                })

                clearInterval(interval)
            }
        }, 1500)
    }

    unsafeWindow.who_teams = {}
    let oldTeamReload = teamReload
    teamReload = function (obj, type) {
        oldTeamReload(obj, type)

        if (type == 1) { // 初始队伍列表
            for (const item of obj.data) {
                who_teams[item.teamId] = item
            }
        } else if (type == 2) { // 创建队伍反馈
            let item = obj.data
            who_teams[item.teamId] = item

            // 如果自己是队长 则自动开始循环战斗
            if (item.teamId === $("#userId").val() && who_app.autoStartPerilTeamFunc) {
                startPerilTeamFunc(2)
                who_app.autoStartPerilTeamFunc = false
            }
        } else if (type == 3) { // 刷新我得队伍
            who_teams[obj.data.teamId] = obj.data
        }
    }

    let oldSendToServerBase = sendToServerBase
    sendToServerBase = function (type, obj) {
        oldSendToServerBase(type, obj)

        if (type === "applyTeam") {
            // 切换队伍 重置计数
            who_app.amIINTeam = true
            who_app.resetCombatCount()

            if (! who_app.latest_join_teams.find(team => team.teamId === obj.teamId && team.pwd === obj.pwd)) {
                $.ajax({
                    url: "/api/getOtherUserInfo?id=" + obj.teamId,
                    success: function (res) {
                        obj.captionName = res.data.user.nickname
                        if (who_app.latest_join_teams.unshift(obj) > 4) {
                            who_app.latest_join_teams.pop()
                        }
                    }
                })
            }
        }
    }

    $('.container-fluid > .homediv > div:first-child').append(`
<div id="who_helper">
<span><strong>Room</strong>: ${roomIndex}</span><br>
<span><strong>Me</strong>: ${userId}</span><br>
<span v-show="amIINTeam"><strong>BattleEnd</strong>: {{ teamBattleEndAt.format('HH:mm:ss') }}<br></span>
<label>
    Battle: <span class="text-success">{{ combat_ok_count }}</span> / <span class="text-danger">{{ combat_bad_count }}</span> / <span>{{ combat_total_count }}</span> / <span class="text-warning">{{ combat_success_rate }}</span>
    <button class="btn btn-default btn-xs" type="button" @click="resetCombatCount">Reset</button>
</label>
<table class="table table-bordered table-condensed" style="margin-bottom: 5px;">
<tr>
    <td>自动战斗</td>
    <td><input type="number" v-model="autoBattleInternalTime" placeholder="间隔" style="width: 50px;">秒</td>
    <td><button class="btn btn-xs" type="button" @click="autoBattleHandler">{{ autoBattle ? '✔' : '✘' }}</button></td>
</tr>
<tr>
    <td>自动帮派</td>
    <td>刷金: <button class="btn btn-xs" type="button" @click="focusOnGold = !focusOnGold">{{ focusOnGold ? '✔' : '✘' }}</button></td>
    <td><button class="btn btn-xs" type="button" @click="autoFactionTask = !autoFactionTask">{{ autoFactionTask ? '✔' : '✘' }}</button></td>
</tr>
<tr>
    <td>自动制作</td>
    <td>防止活力满</td>
    <td><button class="btn btn-xs" type="button" @click="autoMakeFood = !autoMakeFood">{{ autoMakeFood ? '✔' : '✘' }}</button></td>
</tr>
<tr>
    <td>异常提醒</td>
    <td>长时间未战斗</td>
    <td><button class="btn btn-xs" type="button" @click="longTimeNoBattleNotification = !longTimeNoBattleNotification">{{ longTimeNoBattleNotification ? '✔' : '✘' }}</button></td>
</tr>
</table>
<table class="table table-bordered table-condensed">
<tr v-for="team in latest_join_teams">
    <td>{{ team.captionName }}</td>
    <td>{{ team.pwd }}</td>
    <td><button class="btn btn-default btn-xs" type="button" @click="joinLatestJoinTeam(team)">Join</button></td>
</tr>
</table>
<form class="form-inline">
    <div style="margin-bottom: 5px">
        <div class="form-group form-group-sm">
            <input type="text" v-model="captain" placeholder="队长" class="form-control input-sm" style="width: 120px;">
        </div>
        <div class="form-group form-group-sm">
            <input type="text" v-model="inTeamPwd" placeholder="密码" class="form-control input-sm" style="width: 50px;">
        </div>
        <button class="btn btn-success btn-xs" type="button" @click="applyTeam">加入</button>
    </div>
    <div class="form-group form-group-sm">
        <select class="form-control" v-model="fb">
            <option v-for="option in fbOptions" :value="option._id">{{ option.name }}</option>
        </select>
    </div>
    <button class="btn btn-success btn-xs" type="button" @click="autoApplyTeam(false)" title="ApplyTeam">A</button>
    <button class="btn btn-success btn-xs" type="button" @click="autoApplyTeam(true)" title="ApplyOrCreateTeam">AC</button>
    <button class="btn btn-success btn-xs" type="button" @click="autoApplyTeam(true, true)" title="ApplyOrCreateTeam+AutoStart">ACS</button>
</form>
</div>
`)

    unsafeWindow.who_app = new Vue({
        'el': '#who_helper',
        data: {
            autoBattle: false,
            autoBattleInternalTime: GM_getValue(getKey('autoBattleInternalTime'), 5),
            autoFactionTask: false,
            autoMakeFood: false,
            autoStartPerilTeamFunc: false,
            amIINTeam: false,
            combat_ok_count: 0,
            combat_bad_count: 0,
            combat_total_count: 0,
            combat_success_rate: '100.0%',
            focusOnGold: false,
            captain: GM_getValue(getKey('captain'), ''),
            inTeamPwd: GM_getValue(getKey('inTeamPwd'), ''),
            latest_join_teams: GM_getValue(getKey('latest_join_teams'), []),
            longTimeNoBattleNotification: true,
            system: {
                maxLevel: 89
            },
            teamBattleEndAt: moment(),
            userGoodsPages: 1,// 背包物品总页数
            userBaseInfo: {
                nickname: 'nobody',
                'max-vitality-num': 500 + currentLevel,
                'max-energy-num': 300 + currentLevel
            },
            form: {
                goodsName: '',
                goodsNum: ''
            },
            fb: "",
            fbOptions: [],
            subscribes: GM_getValue(getKey('subscribes'), []),
            factionTasks: {
                // 平衡模式的帮派任务
                balance: [
                    "5dca6a232b57001e2bc0273a",
                    "5e13df3496d23f0961a85212",
                    "5dca69c12b57001e2bc02733",
                    "5dca839096003f20fd0df257",
                    "5df337f1b0708370b73f36a3",
                    "5dfc40ff6439e975fbbc6c7b",
                    "5dfa1ad779b2846774bd9f5b",
                    "5e0c2a502837c176c87ba1ef",
                    "5dfec9bc016232536617c314",
                    "5e17f6213ede2d40f654ced5", // 孔雀的羽毛
                ],
                // 金币模式的帮派任务
                gold: [
                    "5e13df3496d23f0961a85212",// 61 军备库任务
                    "5e0c2a502837c176c87ba1ef",// 71 军备库任务
                ]
            },
        },
        created() {
            this.fb = GM_getValue(getKey('fb'), "5dbfd22d4a3e3d2784a6a670") // 默认是密林
            this.getUserInitInfo()

            setInterval(() => {
                if (typeof (combat_ok_count) !== "undefined" && typeof (combat_bad_count) !== "undefined") {
                    if (combat_ok_count + combat_bad_count > 0) {
                        this.combat_ok_count = combat_ok_count
                        this.combat_bad_count = combat_bad_count
                        this.combat_total_count = combat_ok_count + combat_bad_count
                        this.combat_success_rate = (this.combat_ok_count * 100 / this.combat_total_count).toFixed(1) + '%'
                    }
                }
            }, 5000)

            setInterval(() => {
                if (this.amIINTeam) {
                    if (this.longTimeNoBattleNotification && moment().diff(this.teamBattleEndAt, 'seconds') >= 60) {
                        this.longTimeNoBattleNotification = false
                        who_notify('队长长时间未开始战斗', 1)
                    }
                }
            }, 60000)
        },
        computed: {
            factionTasksWanted() {
                return this.focusOnGold ? this.factionTasks.gold : this.factionTasks.balance
            }
        },
        watch: {
            autoBattleInternalTime(n, o) {
                GM_setValue(getKey('autoBattleInternalTime'), n)
            },
            captain(n, o) {
                GM_setValue(getKey('captain'), n)
            },
            inTeamPwd(n, o) {
                GM_setValue(getKey('inTeamPwd'), n)
            },
            fb(n, o) {
                GM_setValue(getKey('fb'), n)
            },
            latest_join_teams(n, o) {
                GM_setValue(getKey('latest_join_teams'), n)
            }
        },
        methods: {
            autoApplyTeam(applyOrCreate, autoStartPerilTeamFunc) {
                if (!this.fb) {
                    return
                }

                let level = parseInt($('#current-level').text())

                for (let i = 4; i > 0; i--) {
                    for (const item of Object.values(who_teams)) {
                        if (item.scenesId == this.fb && !item.is_pwd && item.level[0] < level && item.users.length == i) {
                            applyTeamFunc(item.teamId, false)
                            return
                        }
                    }
                }

                // 找不到队伍则自动创建队伍
                if (!applyOrCreate) {
                    return
                }

                let scene = this.fbOptions.find(item => item._id === this.fb)
                if (scene !== undefined) {
                    this.autoStartPerilTeamFunc = !!autoStartPerilTeamFunc
                    sendToServerBase("createdTeam", {
                        teamScenesId: scene._id,
                        level: [parseInt(scene.min_level), parseInt(scene.max_level)],
                        pwd: ""
                    })
                }
            },
            autoBattleHandler() {
                let auto
                this.autoBattle = ! this.autoBattle
                if(this.autoBattle){
                    auto = setInterval(function(){
                        startPerilTeamFunc();
                    }, this.autoBattleInternalTime*1000)
                } else if (typeof(auto) !== "undefined") {
                    clearInterval(auto)
                }
            },
            addNewSub() {
                this.subscribes.push({
                    checked: true,
                    goodsName: this.form.goodsName,
                    goodsNum: this.form.goodsNum,
                })
            },
            applyTeam() {
                if (this.captain) {
                    $('#inTeamPwd').val('651')
                    applyTeamFunc(this.captain, true)
                }
            },
            getAllUserGoods() {
                for (let i = 1; i <= this.userGoodsPages; i++) {
                    $.get('/api/getUserGoods', {page: i})
                }
            },
            getUserInitInfo() {
                fetch("http://joucks.cn:3344/api/getUserInitInfo", {
                    credentials: "include",
                    method: "GET",
                }).then(function (response) {
                    return response.json()
                }).then(res => {
                    this.userBaseInfo.nickname = res.data.user.nickname
                })
            },
            joinLatestJoinTeam(team) {
                sendToServerBase("applyTeam", team)
            },
            resetCombatCount() {
                combat_ok_count = 0
                combat_bad_count = 0
            },
            setSubscribes() {
                GM_setValue(getKey('subscribes'), this.subscribes)
            },
            subCheckedClicked(sub) {
                sub.checked = !sub.checked
                this.setSubscribes()
            }
        }
    })

    var host = 'http://xx.gl.test'

    function who_log_success(msg) {
        console.debug('%c' + msg, 'color: green; font-size: 16px;')
    }

    function who_log_warning(msg) {
        console.debug('%c' + msg, 'color: yellow; font-size: 16px;')
    }

    function send_to_local(data) {
        let a = new FormData();
        a.append('data', JSON.stringify(data))

        GM_xmlhttpRequest({
            method: "POST",
            url: host + "/api/log",
            data: a,
            onload: function (response) {
            }
        })
    }

    function who_notify(msg, bark) {
        msg = who_app.userBaseInfo.nickname + ':' + msg

        let url = host + "/notify?msg=" + msg

        if (bark) {
            url += '&bark=1'
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (response) {
            }
        })
    }

    function who_check_goods(datum, subscribe) {
        if (datum.goods && datum.goods.name == subscribe.goodsName && datum.count >= subscribe.goodsNum) {
            return true;
        }

        return false;
    }

    $(document).ajaxComplete(function (event, xhr, settings) {
        let res = xhr.responseJSON

        if (settings.url.startsWith("/api/getUserInitInfo")) {
            who_app.userBaseInfo.nickname = res.data.user.nickname
        }

        if (settings.url.startsWith("/api/getSellGoods")) {
            res.data.playerSellUser.map(user => {
                // 遍历线上交易的物品 todo
            })
        }

        if (settings.url.startsWith("/api/getUserGoods")) {
            who_app.userGoodsPages = res.pages
            res.data.map(datum => {
                who_app.subscribes.map(sub => {
                    if (sub.checked && who_check_goods(datum, sub)) {
                        who_log_success(sub.goodsName + '数量达成目标')
                        who_notify(sub.goodsName + '数量达成目标')
                        sub.checked = false;
                        who_app.setSubscribes()
                    }
                })
            })
        }

        if (settings.url.startsWith("/api/getUserInfo")) {
            let user = res.data.user

            if (who_app.autoMakeFood) {
                // 定时制作物品 消耗活力
                if (user.vitality_num + 5 >= who_app.userBaseInfo['max-vitality-num']) {
                    makeLifeGoodsFunc(1)
                }
            }

            // 消耗精力
            if (user.energy_num + 5 >= who_app.userBaseInfo['max-energy-num']) {
                makeLifeGoodsFunc(2)
            }
        }

        if (settings.url.startsWith("/api/getCombatBeMonster")) {
            who_app.fbOptions = [
                {
                    name: '云顶封神塔',
                    _id: '5dfed126016232536617c5e0',
                    min_level: 0,
                    max_level: 300
                }
            ].concat(res.data.combatList)
        }

        if (settings.url.startsWith("/api/getUserTask")) {
            let factionTask = res.data.find(datum => datum.task.task_type === 4)
            if (factionTask !== undefined) {
                if (who_app.autoFactionTask) {
                    if (who_app.factionTasksWanted.includes(factionTask.task._id)) {
                        setTimeout(function () {
                            payUserTask(factionTask.utid)
                        }, 1000)
                    } else {
                        setTimeout(function () {
                            colseUserTask(factionTask.utid)
                        }, 1000)
                    }
                }
            }

            send_to_local({
                type: 'task',
                data: res.data.map(datum => {
                    return datum.task
                })
            })
        }

        if (settings.url.startsWith("/api/payUserTask")) {
            if (res.code == 200) {
                if (who_app.autoFactionTask) {
                    setTimeout(function () {
                        getFationTaskFunc()
                    }, 1000)
                }
            } else {
                who_notify(res.msg)
            }
        }

        if (settings.url.startsWith("/api/closeUserTask")) {
            if (res.code == 200) {
                if (who_app.autoFactionTask) {
                    setTimeout(function () {
                        getFationTaskFunc()
                    }, 1000)
                }
            } else {
                who_notify(res.msg)
            }
        }
    })

    // 增加重新初始化任务列表按钮 (刷帮派任务可能会遇到503导致任务列表不刷新)
    $('.username').append(`<button class="btn btn-xs btn-default" onclick="getUserInitInfo()">🔄 ReInit</button>`)

    // 进入组队大厅
    $('#fishfarm').click()
    if (roomIndex !== 'unset') {
        setTimeout(function () {
            $('a[id="fish-game-btn-c"]')[roomIndex].click()
        }, 500)
    }

    setInterval(function () {
        getUserInfoFunc()
    }, 300000) // 定时更新用户信息
}, 500)