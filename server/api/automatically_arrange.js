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
                if (student[0].ano != null && student[0].rno != null) {
                    connect.rollback(() => connect.release());
                    return done(new Error("123"));
                }

                done(null, student[0], connect);
            })
        },
        // 选出性别匹配的宿舍楼
        function verifyAno(student, connect, done) {
            let sql = "select * from apartment where sex = ?";
            connect.query(sql, [student.sex], function (err, result, fields) {
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
                done(null, student, result, connect);
            })
        },
        function function1(student, buildingList, connect, done) {
            let anoList = []
            for(let i=0; i<buildingList.length; i++)
                anoList.push(buildingList[i].ano);
            let sql1 = `
                select 
                    *
                from 
                    room, student
                where 
                    room.ano in (?) 
                and 
                    room.accomodation > room.haspeople
                and 
                    student.grade = ?
                and 
                    student.department = ?
                and 
                    student.major = ?
                and 
                    student.classnum = ?
                and
                    room.rno = student.rno
                and
                    room.ano = student.ano
            `;
            connect.query(sql1, [anoList, student.grade, student.department, student.major, student.classnum], function (err, result, fields) {
                if (err) {
                    console.error(err);
                    connect.rollback(() => connect.release());
                    return done(new Error("203"));
                }
                if (result.length === 0)
                    return done(null, student, 0, anoList, [], connect);

                done(null, student, 1, anoList, result[0], connect);                
            });            
        },
        function function2(student, status, anoList, room, connect, done) {
            if(status === 1) {
                // 更新宿舍
                let sql3 = `
                    update room
                    set haspeople = haspeople + 1
                    where ano = ? and rno = ?
                `
                connect.query(sql3, [room.ano, room.rno], function(err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, student, 1, anoList, room, connect);
                }) 
            }
            else
                done(null, student, 0, anoList, room, connect)
        },
        function function3(student, status, anoList, room, connect, done) {
            if(status === 1) {
                // 更新学生
                let sql2 = `
                    update student
                    set 
                        ano = ?, rno = ?
                    where student.sno = ?
                `
                connect.query(sql2, [room.ano, room.rno, student.sno], function(err, result, fileds){
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, student, 1, anoList, connect);
                })            
            }
            else 
                done(null, student, status, anoList, connect);

        },
        // 找不到同学院的有空床位宿舍
        function function4(student, status, anoList, connect, done) {
            if(status === 0) {
                let sql1 = `
                    select 
                        *
                    from 
                        room, student
                    where 
                        room.ano in (?) 
                    and 
                        room.accomodation > room.haspeople
                    and 
                        student.grade = ?
                    and 
                        student.department = ?
                    and 
                        student.major = ?
                    and
                        room.rno = student.rno
                    and 
                        room.ano = student.ano
                `;
                connect.query(sql1, [anoList, student.grade, student.department, student.major], function (err, result, fields) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    if (result.length === 0)
                        return done(null, student, 0, anoList, [], connect);

                    done(null, student, 2, anoList, result[0], connect)
                    
                });            
            }
            else
                return done(null, student, status, anoList, [], connect);
        },
        function function5(student, status, anoList, room, connect, done) {
            if(status === 2) {
                // 更新宿舍
                let sql3 = `
                    update room
                    set haspeople = haspeople + 1
                    where ano = ? and rno = ?
                `
                connect.query(sql3, [room.ano, room.rno], function(err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }

                    return done(null, student, 2, anoList, room, connect);
                               
                }) 
            }
            else
                done(null, student, status, anoList, [], connect)
        },
        function function6(student, status, anoList, room, connect, done) {
            if(status === 2) {
                // 更新学生
                let sql2 = `
                    update student
                    set 
                        ano = ?, rno = ?
                    where student.sno = ?
                `
                connect.query(sql2, [room.ano, room.rno, student.sno], function(err, result, fileds){
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, student, 2, anoList, connect);
                })         
            }
            else
                done(null, student, status, anoList, connect);
        },
        function function7(student, status, anoList, connect, done) {
            console.log(3, status);
            if(status === 0) {
                let sql1 = `
                    select 
                        *
                    from 
                        room, student
                    where 
                        room.ano in (?) 
                    and 
                        room.accomodation > room.haspeople
                    and 
                        student.grade = ?
                    and 
                        student.department = ?
                    and
                        room.rno = student.rno
                    and
                        room.ano = student.ano
                `;
                connect.query(sql1, [anoList, student.grade, student.department], function (err, result, fields) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    if (result.length === 0)
                        return done(null, student, 0, anoList, [], connect);

                    return done(null, student, 3, anoList, result[0], connect);
                });  
            } 
            else 
                done(null, student, status, anoList, [], connect);         
        },
        function function8(student, status, anoList, room, connect, done) {
            if(status === 3) {
                // 更新宿舍
                let sql3 = `
                    update room
                    set haspeople = haspeople + 1
                    where ano = ? and rno = ?
                `
                connect.query(sql3, [room.ano, room.rno], function(err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }

                    return done(null, student, 3, anoList, room, connect);
                               
                }) 
            }
            else
                done(null, student, status, anoList, [], connect)
        },
        function function9(student, status, anoList, room, connect, done) {
            if(status === 3) {
                // 更新学生
                let sql2 = `
                    update student
                    set 
                        ano = ?, rno = ?
                    where student.sno = ?
                `
                connect.query(sql2, [room.ano, room.rno, student.sno], function(err, result, fileds){
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, student, 3, anoList, connect);
                })         
            }
            else
                done(null, student, status, anoList, connect);
        },
        function function10(student, status, anoList, connect, done) {
            console.log(4, status)
            if(status === 0) {
                let sql1 = `
                    select 
                        *
                    from 
                        room, student
                    where 
                        room.ano in (?) 
                    and 
                        room.accomodation > room.haspeople
                    and 
                        student.grade = ?
                    and
                        room.rno = student.rno
                    and
                        room.ano = student.ano
                `;
                connect.query(sql1, [anoList, student.grade], function (err, result, fields) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    if (result.length === 0)
                        return done(null, student, 0, anoList, [], connect);

                    return done(null, student, 4, anoList, result[0], connect);
                });  
            } 
            else 
                done(null, student, status, anoList, [], connect);     
        },
        function function11(student, status, anoList, room, connect, done) {
            if(status === 4) {
                // 更新宿舍
                let sql3 = `
                    update room
                    set haspeople = haspeople + 1
                    where ano = ? and rno = ?
                `
                connect.query(sql3, [room.ano, room.rno], function(err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }

                    return done(null, student, 4, anoList, room, connect);
                               
                }) 
            }
            else
                done(null, student, status, anoList, [], connect)
        },
        function function12(student, status, anoList, room, connect, done) {
            if(status === 4) {
                // 更新学生
                let sql2 = `
                    update student
                    set 
                        ano = ?, rno = ?
                    where student.sno = ?
                `
                connect.query(sql2, [room.ano, room.rno, student.sno], function(err, result, fileds){
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, student, 4, anoList, connect);
                })         
            }
            else
                done(null, student, status, anoList, connect);
        },
        function function13(student, status, anoList, connect, done) {
            console.log(5, status)
            if(status === 0) {
                let sql1 = `
                    select 
                        *
                    from 
                        room, student
                    where 
                        room.ano in (?) 
                    and 
                        room.accomodation > room.haspeople
                    and
                        room.rno = student.rno
                    and
                        room.ano = student.ano
                `;
                connect.query(sql1, [anoList], function (err, result, fields) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    if (result.length === 0)
                        return done(null, student, 0, anoList, [], connect);

                    return done(null, student, 5, anoList, result[0], connect);
                });  
            } 
            else 
                done(null, student, status, anoList, [], connect);     
        },
        function function14(student, status, anoList, room, connect, done) {
            if(status === 5) {
                // 更新宿舍
                let sql3 = `
                    update room
                    set haspeople = haspeople + 1
                    where ano = ? and rno = ?
                `
                connect.query(sql3, [room.ano, room.rno], function(err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }

                    return done(null, student, 5, anoList, room, connect);
                               
                }) 
            }
            else
                done(null, student, status, anoList, [], connect)
        },
        function function15(student, status, anoList, room, connect, done) {
            if(status === 5) {
                // 更新学生
                let sql2 = `
                    update student
                    set 
                        ano = ?, rno = ?
                    where student.sno = ?
                `
                connect.query(sql2, [room.ano, room.rno, student.sno], function(err, result, fileds){
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, student, 5, anoList, connect);
                })         
            }
            else
                done(null, student, status, anoList, connect);
        },
        function function16(student, status, anoList, connect, done) {
            console.log(6, status)
            if(status === 0) {
                let sql1 = `
                select 
                    *
                from 
                    room
                where 
                    room.ano in (?) 
                and 
                    room.accomodation > room.haspeople
                `;
                connect.query(sql1, [anoList, student.grade], function (err, result, fields) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    if (result.length === 0)
                        return done(null, student, 0, anoList, [], connect);

                    return done(null, student, 6, anoList, result[0], connect);
                });  
            } 
            else 
                done(null, student, status, anoList, [], connect);     
        },
        function function17(student, status, anoList, room, connect, done) {
            console.log(6, 1, status)
            if(status === 6) {
                // 更新宿舍
                let sql3 = `
                    update room
                    set haspeople = haspeople + 1
                    where ano = ? and rno = ?
                `
                connect.query(sql3, [room.ano, room.rno], function(err, result, fileds) {
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }

                    return done(null, student, 6, anoList, room, connect);
                               
                }) 
            }
            else
                done(null, student, status, anoList, [], connect)
        },
        function function18(student, status, anoList, room, connect, done) {
            console.log(6, 2, status)
            console.log(room);
            console.log(student.sno)
            if(status === 6) {
                // 更新学生
                let sql2 = `
                    update student
                    set 
                        ano = ?, rno = ?
                    where student.sno = ?
                `
                connect.query(sql2, [room.ano, room.rno, student.sno], function(err, result, fileds){
                    if (err) {
                        console.error(err);
                        connect.rollback(() => connect.release());
                        return done(new Error("203"));
                    }
                    return done(null, connect);
                })         
            }
            else
                done(null, connect);
        }
    ], function (err, connect) {
        if (err) {
            return next(err);
        }
        console.log(connect)
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