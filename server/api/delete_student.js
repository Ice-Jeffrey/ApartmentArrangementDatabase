'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js')
const return_obj = require('../tool/return_obj.js');
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
        function verifySno(connect, done) {
            let sql = "select * from student where sno = ? ";
            connect.query(sql, [req.body.sno], function (err, student, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (student.length == 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("120"));
                }

                done(null, connect, student[0]);
            })
        },
        function deleteStudentInDatabase(connect, student, done) {
            let sql = "delete from student where sno = ?";
            connect.query(sql, [req.body.sno], function (err, result, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("200"));
                }
                //默认成功了
                done(null, connect, student);
            })
        },
        function upadateRoom(connect, student, done) {
            if (student.ano != null && student.rno != null) {
                let sql = `
                    update 
                        room
                    set 
                        haspeople = haspeople - 1
                    where
                        room.ano = ?
                    and 
                        room.rno = ?
                    `;
                let param_list = [
                    student.ano,
                    student.rno
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
            else 
                done(null, connect)
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
                msg: "删除学生成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;