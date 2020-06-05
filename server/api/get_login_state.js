'use strict'
const express = require('express');
const return_obj = require('../tool/return_obj.js');
const router = express.Router();

router.get("/", function (req, res, next) {
    if ('is_login' in req.session) {
        res.send(return_obj.success({
            msg: "用户已登录",
            is_login: true,
            uid: req.session.uid,
            username: req.session.username,
            email: req.session.email
        }))
    } else {
        res.send(return_obj.success({
            msg: "用户未登录",
            is_login: false
        }));
    }
})

module.exports = router;