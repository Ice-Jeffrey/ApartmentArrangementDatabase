'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js');
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
        function verifyAno(connect, done) {
            let sql = "select * from apartment where ano = ? ";
            connect.query(sql, [req.body.ano], function (err, building, fields) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (building.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("125"));
                }

                done(null, connect, building[0]);
            })
        },
        function verifyFloor(connect, building, done) {
            if(req.body.hasfloor < building.hasfloor) {
                let sql = `select * from room where ano = ? and floor >= ? and floor <= ?`
                let param_list = [req.body.ano, req.body.hasfloor, building.hasfloor];
                connect.query(sql, param_list, function (err, result, fileds) {
                    if(err) {
                        console.log(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    if (result.length != 0) {
                        connect.rollback(() => connect.release());
                        return done(new Error("126"))
                    }

                    return done(null, connect);
                })
            }
            else 
                done(null, connect)
        },
        function verifySex(connect, done) {
            let sql = `select * from apartment where ano = ?`
            
            connect.query(sql, [req.body.ano], function (err, result, fileds) {
                if(err) {
                    console.log(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (result[0].sex != req.body.sex) {
                    connect.rollback(() => connect.release());
                    return done(new Error("127"))
                }

                done(null, connect);
            })
        },
        function verifyRoom(connect, done) {
            let sql = `select count(*) from room where ano = ?`
            
            connect.query(sql, [req.body.ano], function (err, result, fileds) {
                if(err) {
                    console.log(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (result.length > req.query.hasroom) {
                    connect.rollback(() => connect.release());
                    return done(new Error("128"))
                }

                done(null, connect);
            })
        },
        function changeBuildingInfo(connect, done) {
            let sql = `
                update 
                    apartment
                set 
                    hasfloor = ? ,
                    sex = ? ,
                    starttime = ?,
                    hasroom = ?
                where
                    ano = ?
            `;

            function transferDate(date) {
                var time = date
                var dt = new Date(time)
                var timeStr = dt.getFullYear() + '-' + (dt.getMonth() + 1 < 10 ? "0" + (dt.getMonth()+1 ) : dt.getMonth()+1 ) + '-' + (dt.getDate() + 1 < 10 ? "0" + (dt.getDate() ) : dt.getDate() )
                return timeStr
            }

            let param_list = [
                parseInt(req.body.hasfloor),
                req.body.sex,
                transferDate(req.body.starttime),
                parseInt(req.body.hasroom),
                parseInt(req.body.ano)
            ];
            connect.query(sql, param_list, function (err, result, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("200"));
                }
                return done(null, connect);
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
                msg: "修改宿舍楼信息成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;