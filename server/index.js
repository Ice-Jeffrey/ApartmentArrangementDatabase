const express = require("express");
const path = require("path");
const session = require("express-session");
const session_conf = require("./config/session_config.js");
const body_parser = require('body-parser');

// 创建app实例
const app = express();

// 为app挂载session中间件，用于实现登录功能
app.use(session(session_conf));

// 设置app监听端口为8080
app.listen(8080, function () {
    console.log("服务器已经在本地" + 8080 + "端口打开");
})

// app加载静态资源
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "uploads")));

// app挂载bodyparser中间件
app.use(body_parser.urlencoded());
app.use(body_parser.json());

// 为app挂载路由
app.use("/", require("./router.js"));