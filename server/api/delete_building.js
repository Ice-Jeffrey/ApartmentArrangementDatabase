'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js')
const return_obj = require('../tool/return_obj.js');
const error = require("../tool/error_message.js");
const router = express.Router();

// 验证登录态
router.post("/", verify_login);

//业务处理
router.post("/", function (req, res, next) {
    async.waterfall([
        function getConnection(done) {
            pool.getConnection(function (err, connect) {
                if (err) {
                    console.error(err);
                    return done(new Error("202"));
                }
                done(null, connect);
            })
        },
        function beginTransaction(connect, done) {
            connect.beginTransaction(function (err) {
                if (err) {
                    console.error(err);
                    connect.release();
                    return done(new Error("203"));
                }
                done(null, connect);
            })
        },
        function verifyBuilding(connect, done) {
            let sql = "select * from apartment where ano = ?";
            connect.query(sql, [req.body.ano], function (err, building, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (building.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("133"));
                }
                done(null, connect);
            })
        },
        function verifyRoom(connect, done) {
            let sql = "select * from room where ano = ?";
            connect.query(sql, [req.body.ano, req.body.rno], function (err, room, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (room.length != 0 && room[0].haspeople != 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("134"));
                }

                done(null, connect);
            })
        },
        function deleteBuildingInDatabase(connect, done) {
            let sql = "delete from apartment where ano = ?";
            connect.query(sql, [req.body.ano], function (err, result, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("200"));
                }
                //默认成功了
                done(null, connect);
            })
        }
    ], function (err, connect) {
        if (err) {
            return next(err);
        }
        connect.commit(function (err) {
            if (err) {
                connect.rollback(() => connect.release());
                return next(new Error("204"));
            }
            connect.release();
            res.send(return_obj.success({
                msg: "删除寝室成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;