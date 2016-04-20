/**
 * Created by peisy on 2016/04/20.
 */
var RegisterPanel = cc.Node.extend({
    ctor: function () {
        this._super();
        this.registerLayer = ccs.csLoader.createNode(res.new_user_layer_json);
        this.initData();
    },
    initData: function () {

        var root = this.registerLayer.getChildByName('root');
        var userName = root.getChildByName('user');
        var registerBtn = root.getChildByName('btn').getChildByName('btn');
        var closeBtn = root.getChildByName('close_btn');
        var psw = root.getChildByName('psw');
        var psw2 = root.getChildByName('psw2');
        bindButtonCallback(registerBtn, function () {
            if(!cc.isString(userName.getString())){
                BasicPopup.alert('提示',"用户名不能为空或格式不正确");
            }else if(this.passwordValidate(psw.getString(),psw2.getString())){
                Network.register(userName.getString(),psw.getString(),function(result,data){
                    if(result){
                        this.hiddenRegisterPopup();
                    }else{
                        BasicPopup.alert('提示',data);
                    }
                }.bind(this))
            }
        }.bind(this));
        bindButtonCallback(closeBtn, function () {
            this.hiddenRegisterPopup();
        }.bind(this));
    },
    passwordValidate: function(pws,pws2){
        var error = "";
        if(!cc.isString(pws) || pws.length < 6 || !cc.isString(pws2) || pws2.length < 6){
            error = '密码不能为空或格式不正确';
        }else if(pws !== pws2){
            error = '两次密码不一致';
        }
        if(error){
            BasicPopup.alert('提示',error);
            return false;
        }else{
            return true;
        }
    },
    openRegisterPopup: function () {
        GamePopup.openPopup(this.registerLayer, null/*cc.p(335, 585)*/,false);
    },
    hiddenRegisterPopup: function () {
        GamePopup.closePopup(this.registerLayer);
    }
});
RegisterPanel.open = function(){
    var register = new RegisterPanel();
    register.openRegisterPopup();
}