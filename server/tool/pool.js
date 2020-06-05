/*
    author: Jeffrey
    功能：构建数据库连接池并输出
*/


"use strict"

const mysql = require("mysql");
const mysql_conf = require("../config/mysql_config.js");

let pool = mysql.createPool(mysql_conf);

module.exports = pool;