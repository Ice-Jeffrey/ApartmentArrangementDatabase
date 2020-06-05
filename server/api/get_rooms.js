'use strict'

const express = require('express');
const async = require("async");
const pool = require('../tool/pool.js');
const verify_login = require('../middleware/verify_login.js')
const return_obj = require('../tool/return_obj.js');
const error = require("../tool/error_message");
const router = express.Router();

//验证用户登录状态
router.get("/", verify_login);

//查询
router.get("/", function (req, res, next) {
    async.waterfall([
        function (done) {
            let sql = `
            select 
                ano, rno, price, accomodation, floor, sex, telenumber, haspeople,
                (accomodation - haspeople) as remain 
            from 
                room

                ${req.query.ano ? "where ano = ?" : ""}
                ${req.query.rno ? "and rno = ?" : ""}
                ${req.query.remain ? "and accomodation - haspeople = ?" : ""}

            limit 
                ?
            offset
                ?
            `;
            
            let param_list = [];
            if (req.query.ano) {
                param_list.push(parseInt(req.query.ano));
            }
            if (req.query.rno) {
                param_list.push(parseInt(req.query.rno));
            }
            if (req.query.remain) {
                param_list.push(parseInt(req.query.remain));
            }

            let offset = 0;
            let limit = 10;
            if (req.query.ppn) limit = req.query.ppn * 1;
            if (req.query.page) offset = (req.query.page - 1) * limit;
            param_list.push(limit);
            param_list.push(offset)

            pool.query(sql, param_list, function (err, room_list, fileds) {
                if (err) {
                    console.error(err);
                    return done(new Error("200"), null);
                }
                done(null, room_list);
            });
        },
    ], function (error, room_list) {
        if (error) {
            console.log(error);
            return next(error);
        }
        res.send(return_obj.success({
            msg: "获取数据成功",
            room_list: room_list
        }));
    });
})



//错误处理
router.use("/", function (err, req, res, next) {
    console.error(new Date());
    error.send_error_message(err, res);
})


module.exports = router;