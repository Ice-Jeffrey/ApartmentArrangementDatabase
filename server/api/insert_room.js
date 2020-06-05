'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js');
const return_obj = require("../tool/return_obj.js");
const error = require('../tool/error_message.js');
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
                if (buildings.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("126"));
                }
                if (req.body.floor > buildings[0]. hasfloor) {
                    connect.rollback(() => connect.release());
                    return done(new Error("135"));
                }
                done(null, connect, buildings[0].sex);
            })
        },
        function verifyRoom(connect, sex, done) {
            let sql = "select * from room where ano = ? and rno = ?";
            connect.query(sql, [req.body.ano, req.body.rno], function (err, rooms, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (rooms.length != 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("136"));
                }
                done(null, connect, sex);
            })
        },
        function insertRoom(connect, sex, done) {
            let sql = `
                insert into 
                    room (ano, rno, price, accomodation, telenumber, sex, haspeople, floor)
                values (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `;
  
            let param_list = [
                parseInt(req.body.ano),
                parseInt(req.body.rno),
                parseInt(req.body.price),
                parseInt(req.body.accomodation),
                req.body.telenumber,
                sex,
                0,
                parseInt(req.body.floor)
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
        },
        function updateBuilding(connect, done) {
            let sql = `
                update 
                    apartment
                set 
                    hasroom = hasroom + 1
                where 
                    ano = ?
            `
            connect.query(sql, [parseInt(req.body.ano)], function (err, result, fileds) {
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
                msg: "添加寝室成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;