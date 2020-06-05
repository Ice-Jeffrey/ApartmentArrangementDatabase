'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js')
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
        function verifySno(connect, done) {
            let sql = "select * from student where sno = ? ";
            connect.query(sql, [req.body.sno], function (err, student, fields) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (student.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("120"));
                }

                done(null, student[0], connect);
            })
        },
        function verifyAno(student, connect, done) {
            let sql = "select * from apartment where ano = ? ";
            connect.query(sql, [req.body.ano], function (err, result, fields) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (result.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("125"));
                }
                if (result[0].sex != student.sex) {
                    connect.rollback(() => connect.release());
                    return done(new Error("121"));
                }
                done(null, student, connect);
            })
        },
        function verifyRno(student, connect, done) {
            let sql = "select * from room where ano = ? and rno = ?";
            connect.query(sql, [req.body.ano, req.body.rno], function (err, result, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (result.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("133"));
                }
                else if (result[0].haspeople === result[0].accomodation) {
                    connect.rollback(() => connect.release());
                    return done(new Error("122"));
                }

                done(null, student, connect);
            })
        },
        function changeRoomInfo(student, connect, done) {
            if(student.ano != null && student.rno != null) {
                let sql = `
                    update 
                        room 
                    set 
                        haspeople = haspeople + 1
                    where 
                        ano = ? and
                        rno = ?
                `

                let param_list = [
                    req.body.ano,
                    req.body.rno
                ]

                connect.query(sql, param_list, function (err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("200"));
                    }
                    return done(null, connect);
                })
            }
            else 
                return done(null, student, connect);
        },
        function manuallyArrange(student, connect, done) {
            let sql = `
                update 
                    student
                set 
                    ano = ? ,
                    rno = ?
                where
                    sno = ?
            `;
            let param_list = [
                req.body.ano,
                req.body.rno,
                req.body.sno
            ];
            connect.query(sql, param_list, function (err, result, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("200"));
                }
                return done(null, connect);
            })
        },
        
        function updateRoomInfo(connect, done) {
            let sql = `
                update 
                    room 
                set 
                    haspeople = haspeople - 1
                where 
                    ano = ? and
                    rno = ?
            `

            let param_list = [
                student.ano,
                student.rno
            ]

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
                msg: "成功为学生分配宿舍"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;