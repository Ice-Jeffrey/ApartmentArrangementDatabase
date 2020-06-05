/*
    author: Jeffrey
    function: nodejs session配置文件
*/

"use strict"
module.exports = {
    secret: 'secret',
    resave: 'true',
    saveUninitialized: true,
    cookie:{
        maxAge: 1000 * 60 * 60 * 24 * 14
    }
}