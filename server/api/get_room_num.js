'use strict'
const express = require('express');
const async = require('async');
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js')
const return_obj = require('../tool/return_obj.js');
const error = require("../tool/error_message");
const router = express.Router();

//验证登录
router.get('/', verify_login);

//业务处理
router.get('/', function (req, res, next) {
    async.waterfall([
        function structureSQL(done) {
            let sql = `
                select
                    count(*) as room_num
                from
                    room
            `;
            
            done(null, sql);
        },
        function getBuildingNum(sql, done) {
            pool.query(sql, function (err, room_num, fileds) {
                if (err) {
                    console.error(err);
                    return done(new Error("200"));
                }
                done(null, room_num);
            });
        },
    ], function (err, room_num) {
        if (err) {
            return next(err);
        }
        res.send(return_obj.success({
            msg: "获取寝室数量成功",
            room_num: room_num[0].room_num
        }))
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})

module.exports = router;