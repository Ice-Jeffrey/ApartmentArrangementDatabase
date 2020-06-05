'use strict'
const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js')
const error = require('../tool/error_message.js');
const return_obj = require("../tool/return_obj.js");
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
            connect.query(sql, [req.body.sno], function (err, students, fileds) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (students.length != 0) {
                    connect.rollback(() => connect.release());
                    return done(new Error("120"));
                }
                done(null, connect);
            })
        },
        function insertStudent(connect, done) {
            let sql = `
                insert into 
                    student
                values (
                    ?,
                    ?,
                    ?,
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
                parseInt(req.body.sno),
                req.body.sname,
                req.body.sex,
                req.body.ethnicity,
                req.body.major,
                req.body.classnum,
                req.body.phonenumber,
                null,
                null,
                req.body.department,
                parseInt(req.body.grade)
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
                msg: "添加学生成功"
            }));
        })
    })
})

//错误处理
router.use("/", function (err, req, res, next) {
    error.send_error_message(err, res);
})


module.exports = router;