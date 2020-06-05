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
                *
            from 
                apartment

                ${req.query.ano ? "where ano = ?" : ""}
                ${req.query.sex ? "and sex like ?" : ""}
            limit ?
            offset ?
            `;
            
            let param_list = [];
            if (req.query.ano) {
                param_list.push(parseInt(req.query.ano));
            }
            if (req.query.sex) {
                param_list.push("%" + req.query.sex + "%");
            }

            let offset = 0;
            let limit = 10;
            if (req.query.ppn) limit = req.query.ppn * 1;
            if (req.query.page) offset = (req.query.page - 1) * limit;
            param_list.push(limit);
            param_list.push(offset)
            
            pool.query(sql, param_list, function (err, building_list, fileds) {
                if (err) {
                    console.error(err);
                    return done(new Error("200"), null);
                }
                done(null, building_list);
            });
        },
    ], function (error, building_list) {
        if (error) {
            console.log(error);
            return next(error);
        }
        res.send(return_obj.success({
            msg: "获取数据成功",
            building_list: building_list
        }));
    });
})



//错误处理
router.use("/", function (err, req, res, next) {
    console.error(new Date());
    error.send_error_message(err, res);
})


module.exports = router;