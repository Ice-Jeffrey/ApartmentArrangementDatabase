"use strict"

const express = require("express");
const pool = require("../tool/pool.js");
// sconst verify_login = require('../middleware/verify_login.js')
const verify_no_login = require('../middleware/verify_no_login.js');
const return_obj = require('../tool/return_obj.js');
// const crypto = require("crypto");

const router = express.Router();

//使用登录状态验证中间件
router.post("/", verify_no_login);

//查询数据库
router.post("/", function (req, res) {
    var sql = `
        select  
            Uid,
            Username,
            password,
            email
        from user
        where user.Username = ?
    `
    pool.query(sql, [req.body.username], function (err, user_list, fileds) {
        if (err) {
            console.error(err);
            res.send(return_obj.fail("200", "调用数据库接口错误"));
            return;
        }
        //检查用户存在性
        if (user_list.length == 0) {
            res.send(return_obj.fail("104", "用户不存在"));
            return;
        }
        //检查密码正确性
        // var password_md5 = crypto.createHash("md5").update(req.body.password).digest("hex");
        if (req.body.password == user_list[0].password) {
            //设置session
            req.session.is_login = true;
            req.session.uid = user_list[0].Uid;
            req.session.username = user_list[0].Username;
            req.session.email = user_list[0].email;

            res.send(return_obj.success({
                "msg": "登录成功"
            }));
        } else {
            res.send(return_obj.fail("105", "用户账号密码不匹配"))
        }
    })
})

module.exports = router;