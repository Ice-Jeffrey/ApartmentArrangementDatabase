"use strict"
const express = require("express");

const router = express.Router();

// 登录
router.use("/login", require("./api/login.js"));

// 获取登录状态
router.use("/get_login_state", require("./api/get_login_state"));

// 退出登录
router.use("/logout", require("./api/logout.js"));

// 获取宿舍楼数量
router.use("/get_building_num", require("./api/get_building_num.js"));

// 获取寝室数量
router.use("/get_room_num", require("./api/get_room_num.js"));

// 获取学生数量
router.use("/get_student_num", require("./api/get_student_num.js"));

// 获取学生列表
router.use("/get_student", require("./api/get_student.js"));

// 添加学生
router.use("/insert_student", require("./api/insert_student.js"));

// 删除学生
router.use("/delete_student", require("./api/delete_student.js"));

// 修改学生信息
router.use("/change_student_info", require("./api/change_student_info.js"));

// 手动分配宿舍
router.use("/manually_arrange", require("./api/manually_arrange.js"));

// 获取公寓楼列表
router.use("/get_building", require("./api/get_building.js"));

// 插入宿舍楼
router.use("/insert_building", require("./api/insert_building.js"));

// 修改宿舍楼信息
router.use("/change_building_info", require("./api/change_building_info.js"));

// 删除宿舍楼
router.use("/delete_building", require("./api/delete_building.js"));

// 获取房间列表
router.use("/get_rooms", require("./api/get_rooms.js"));

// 插入寝室
router.use("/insert_room", require("./api/insert_room.js"));

// 修改寝室信息
router.use("/change_room_info", require("./api/change_room_info.js"));

// 删除寝室
router.use("/delete_room", require("./api/delete_room.js"));

// 自动分配宿舍
router.use("/automatically_arrange", require("./api/automatically_arrange.js"));

module.exports = router;