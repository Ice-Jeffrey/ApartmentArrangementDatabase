const return_obj = require("./return_obj.js");

exports.send_error_message = function(err, res) {
    console.error(err);
    switch (err.message) {
        case "100":
            res.send(return_obj.fail("100", "缺少必要的参数"));
            break;
        case "101":
            res.send(return_obj.fail("101", "传入参数格式有误"));
            break;
        case "104":
            res.send(return_obj.fail("104", "用户不存在"));
            break;
        case "105":
            res.send(return_obj.fail("105", "用户账号密码不匹配"));
            break;
        case "120":
            res.send(return_obj.fail("120", "找不到对应学生"));
            break;
        case "121":
            res.send(return_obj.fail("121", "性别冲突"));
            break;
        case "122":
            res.send(return_obj.fail("122", "宿舍人数已满"));
            break;
        case "123":
            res.send(return_obj.fail("123", "已为该学生分配过宿舍"));
            break;
        case "124":
            res.send(return_obj.fail("124", "同号宿舍楼已存在"));
            break;
        case "125":
            res.send(return_obj.fail("125", "找不到对应宿舍楼"));
            break;
        case "126":
            res.send(return_obj.fail("126", "无法修改楼层"));
            break;
        case "127":
            res.send(return_obj.fail("127", "入住学生性别冲突"));
            break;
        case "128":
            res.send(return_obj.fail("128", "已占用房间数多于修改后目标房间数"));
            break;
        case "129":
            res.send(return_obj.fail("129", "找不到寝室"));
            break;
        case "130":
            res.send(return_obj.fail("130", "修改后目标人数小于已有人数"));
            break;
        case "131":
            res.send(return_obj.fail("131", "找不到对应寝室"));
            break;
        case "132":
            res.send(return_obj.fail("132", "寝室仍有学生，无法删除"));
            break;
        case "133":
            res.send(return_obj.fail("133", "找不到宿舍楼"));
            break;
        case "134":
            res.send(return_obj.fail("134", "宿舍楼仍有学生，无法删除"));
            break;
        case "135":
            res.send(return_obj.fail("135", "楼层超出限制"));
            break;
        case "136":
            res.send(return_obj.fail("136", "寝室已存在"));
            break;
        case "137":
            res.send(return_obj.fail("137", "无可分配宿舍"));
            break;
        case "200":
            res.send(return_obj.fail("200", "调用数据库接口出错"));
            break;
        case "202":
            res.send(return_obj.fail("202", "获取数据库连接出错"));
            break;
        case "203":
            res.send(return_obj.fail("203", "开启事务失败"));
            break;
        case "204":
            res.send(return_obj.fail("204", "提交事务失败"));
            break;
        case "400":
            res.send(return_obj.fail("400", "未检索到寝室"));
            break;
        default:
            res.send(return_obj.fail("500", "出乎意料的错误"));
            break;
    }
};