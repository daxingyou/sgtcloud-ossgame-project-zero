var BATTLE_STATE = {
    STATE_NORMAL_BATTLE: 0,
    STATE_BOSS_BATTLE: 1,
    STATE_BOSS_READY: 2,
};


var BattlePanel = cc.Node.extend({

    ctor: function () {
        this._super();

        var battleLayer = ccs.csLoader.createNode(res.battle_layer_json);
        this.height = battleLayer.height;
        this.width = battleLayer.width;
        this.addChild(battleLayer);

        var root = battleLayer.getChildByName('root');
        this.enemyLifeText = root.getChildByName('enemy_life_text');
        this.enemyLifeBar = root.getChildByName('enemy_life_bar');
        this.timeText = root.getChildByName('time_text');
        this.icon = root.getChildByName('icon');
        this.timeBar = root.getChildByName('time_bar');

        this.buffList = root.getChildByName('buff_list');
        //this.buffList.setLocalZOrder(9000);


        this.timeText.setVisible(false);

        this.statistics_btn = root.getChildByName("statistics_btn");
        bindButtonCallback(this.statistics_btn, function () {
            //var staticUnit = new StatisticsUnit();

            //staticUnit.ignoreAnchorPointForPosition(true);
            //popup(staticUnit,4000);
            popup(new GamePopup(new StatisticsUnit(), cc.p(320, 580), false), 4000);
        });
        this.rewardBtn = root.getChildByName('reward_btn');

        bindButtonCallback(this.rewardBtn, function () {
            this.openPopup();
        }.bind(this));
        this.loadRewardBtn();

        Loot.prototype.getPackPosition = function () {
            return this.pack_btn.convertToWorldSpace(this.pack_btn.getPosition());
        }.bind(this);

        this.pack_btn = root.getChildByName('pack_btn');
        this.pack_btn.setLocalZOrder(1);
        bindButtonCallback(this.pack_btn, function () {
            var packUnit = new PackUnit();
            var gamePopup = new GamePopup(packUnit, cc.p(320, 580), false);
            popup(gamePopup, 3000);
        }.bind(this));

        customEventHelper.bindListener(EVENT.PACK_VALUE_UPDATE, function () {
            this.pack_btn.runAction(cc.sequence(cc.scaleBy(0.1, 1.5), cc.scaleTo(0.1, 0.5)));
        }.bind(this));
        var container = root.getChildByName('battle_bg');

        this.battleField = new BattleField(container);
        this.battleField.initSpritesPositions(root.getChildByName('sprites'));
        this.battleField.initBattle(PlayerData.getStageData());

        customEventHelper.bindListener(EVENT.FIGHT_BOSS_BATTLE, function () {
            PlayerData.getStageData().goToBossBattle();
            this.enableBossBattleTimeCounter(PlayerData.getStageData());
            this.battleField.prepareBattle(PlayerData.getStageData());
        }.bind(this));
        customEventHelper.bindListener(EVENT.LEAVE_BOSS_BATTLE, function () {
            PlayerData.getStageData().leaveBossBattle();
            this.disableBossBattleTimeCounter();
            this.battleField.prepareBattle(PlayerData.getStageData());
        }.bind(this));

        customEventHelper.bindListener(EVENT.UPDATE_ENEMY_LIFE, function (event) {
            var max = event.getUserData().max;
            var life = event.getUserData().life;
            this.enemyLifeText.ignoreContentAdaptWithSize(true);
            this.enemyLifeText.setString(life);
            this.enemyLifeBar.setPercent(life / max * 100);
        }.bind(this));

        DamageNumber.initPool();

        this.update = function (dt) {
            {
                //customEventHelper.sendEvent(EVENT.TEST_BLOCK);
                if (this.intervalState) {
                    this.intervalTime += dt;
                    if (this.intervalTime > CONSTS.flySpirit_interval_time) {
                        this.battleField.showFairy();
                        this.intervalState = false;
                    }
                }
                var stage = PlayerData.getStageData();
                if (stage.isBossBattle()) {
                    this.updateBossBattleTime(dt, stage);
                }
            }
        },
        this.reset();
        this.scheduleUpdate();
    },

    openPopup: function () {
        var offlineRewardLayer = ccs.csLoader.createNode(res.offline_reward_layer);

        var offlineRewardLayerRoot = offlineRewardLayer.getChildByName('root');
        var offlineRewardLayerBtn = offlineRewardLayerRoot.getChildByName('btn').getChildByName('offline_btn');

        var offlineRewardLayerBox = offlineRewardLayerRoot.getChildByName('box');
        var rewards = player.not_get_reward;
        for (var key in rewards) {
            if (rewards.hasOwnProperty(key)) {
                var tempKey = key;
                if (key.indexOf("key") != -1) {
                    var icon = offlineRewardLayerBox.getChildByName("key");
                    icon.loadTexture("res/materialUI/" + tempKey + ".png");
                    key = "key";
                }
                var offlineRewardLayerText = offlineRewardLayerBox.getChildByName(key + '_text');
                offlineRewardLayerText.ignoreContentAdaptWithSize(true);
                offlineRewardLayerText.setString(rewards[tempKey]);
            }
        }
        var gamePopup = new GamePopup(offlineRewardLayer);
        //bindTouchEventListener(,);
        bindButtonCallback(offlineRewardLayerBtn, function () {
            offlineRewardLayer.removeFromParent();
            self.rewardBtn.visible = false;
            gamePopup.removeFromParent();
            PlayerData.receiveOfflineReward();
            customEventHelper.sendEvent(EVENT.GOLD_VALUE_UPDATE);
            customEventHelper.sendEvent(EVENT.GEM_VALUE_UPDATE);
            //customEventHelper.sendEvent(EVENT);
            PlayerData.updatePlayer();
            // return true;
        });
        popup(gamePopup, 4000);
        //gamePopup.popup();
    },
    reset: function () {
        this.intervalTime = 0;
        this.intervalState = true;
    }
    ,
    loadRewardBtn: function () {
        if (cc.isObject(player.not_get_reward)) {
            this.rewardBtn.visible = true;
        } else {
            this.rewardBtn.visible = false;
        }
    }
    ,
    disableBossBattleTimeCounter: function () {
        this.timeText.visible = false;
        this.timeBar.visible = false;
        this.icon.visible = true;
    }
    ,
    enableBossBattleTimeCounter: function (stage) {
        this.timeText.visible = true;
        this.timeBar.visible = true;
        this.icon.visible = false;
        this.boosTimeMax = stage.getBossTimeMax();
        //var self = this;
        this.timeText.ignoreContentAdaptWithSize(true);
    }
    ,
    updateBossBattleTime: function (dt, stage) {
        if (Math.floor(this.boosTimeMax) < 0) {
            customEventHelper.sendEvent(EVENT.LEAVE_BOSS_BATTLE);
        } else {
            this.boosTimeMax = this.boosTimeMax - dt;
            this.timeText.setString(Math.floor(this.boosTimeMax));
            this.timeBar.setPercent(Math.floor(this.boosTimeMax) / stage.getBossTimeMax() * 100);
        }
    }
    ,

});
