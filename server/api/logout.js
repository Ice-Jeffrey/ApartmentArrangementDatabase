'use strict'
const express = require('express');
const router = express.Router();
const verify_login = require('../middleware/verify_login.js')
const return_obj = require('../tool/return_obj.js');

//登录状态验证
router.get("/", verify_login);

router.get("/", function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.error(err);
            res.send(return_obj.fail("300", "调用退出接口发生错误"));
        }
        res.send(return_obj.success({
            "msg": "退出成功"
        }));
    })
})

module.exports = router;