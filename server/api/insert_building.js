'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js');
const return_obj = require("../tool/return_obj.js");
const error = require("../tool/error_message");
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
        function verifyAno(connect, done) {
            let sql = "select * from apartment where ano = ? ";
            connect.query(sql, [req.body.ano], function (err, buildings, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (buildings.length != 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("124"));
                }

                done(null, connect);
            })
        },
        function insertBuilding(connect, done) {
            let sql = `
                insert into 
                    apartment (ano, hasfloor, hasroom, starttime, sex)
                values (
                    ?,
                    ?,
                    0,
                    ?,
                    ?
                )
            `;
            function transferDate(date) {
                var time = date
                var dt = new Date(time)
                var timeStr = dt.getFullYear() + '-' + (dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth()+1 ) : dt.getMonth()+1 ) + '-' + (dt.getDate() + 1 < 10 ? "0" + (dt.getDate() ) : dt.getDate() ) + ' ' 
                + (dt.getHours() + 1 < 10 ? "0" + (dt.getHours() ) : dt.getHours() ) + ':' + (dt.getMinutes() + 1 < 10 ? "0" + (dt.getMinutes() ) : dt.getMinutes()) 
                + ':' +(dt.getSeconds() + 1 < 10 ? "0" + (dt.getSeconds()) : dt.getSeconds())
                return timeStr
            }
  
            let param_list = [
                parseInt(req.body.ano),
                parseInt(req.body.hasfloor),
                transferDate(req.body.starttime),
                req.body.sex
            ];
            connect.query(sql, param_list, function (err, result, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("200"));
                }
                if (result.affectedRows == 1) {
                    return done(null, connect);
                } else {
                    connect.rollback(() => connect.release());
                    return done(new Error("500"));
                }
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
                msg: "添加宿舍楼成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;