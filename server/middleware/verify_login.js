'use strict'
const return_obj = require("../tool/return_obj.js")

module.exports = function(req,res,next){
    if('is_login' in req.session ){
        next();
    }else{
        res.send(return_obj.fail('102','用户未登录'));
    }
}