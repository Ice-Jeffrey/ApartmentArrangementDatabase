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
        function verifyRoom(connect, done) {
            let sql = "select * from room where ano = ? and rno = ?";
            connect.query(sql, [req.body.ano, req.body.rno], function (err, room, fields) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (room.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("129"));
                }
                if (room[0].haspeople > req.body.accomodation) {
                    connect.rollback(() => connect.release());
                    return done(new Error("130"));
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
            let sql = `select * from room where ano = ? and floor >= ? and floor <= ?`
            var minValue, maxValue;
            if(req.body.floor < building.hasfloor) {
                minValue = req.body.hasfloor;
                maxValue = building.hasfloor;
            }
            else {
                minValue = building.hasfloor;
                maxValue = req.body.floor;
            }
            let param_list = [req.body.ano, minValue, maxValue];
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

                done(null, connect);
            })
        },
        function changeRoomInfo(connect, done) {
            let sql = `
                update 
                    room
                set 
                    floor = ? ,
                    accomodation = ? ,
                    price = ?,
                    telenumber = ?
                where
                    ano = ? and rno = ?
            `;

            let param_list = [
                parseInt(req.body.floor),
                parseInt(req.body.accomodation),
                parseInt(req.body.price),
                req.body.telenumber,
                parseInt(req.body.ano),
                parseInt(req.body.rno)
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
                msg: "修改寝室信息成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;