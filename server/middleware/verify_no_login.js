'use strict'
const return_obj = require("../tool/return_obj.js")

module.exports = function (req, res, next) {
    if ("is_login" in req.session) {
        res.send(return_obj.fail('103', '用户已登录'));
    } else {
        next();
    }
}