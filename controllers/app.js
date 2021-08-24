const mysql = require("../mysql");
const bcrypt = require("bcrypt");
const services = require("../services/server.service");
const jwt = require('jsonwebtoken');

function mysqlCmd(query) {
    return new Promise((revolve, reject) => {
        mysql.query(query, (error, results) => {
            if (error)
                return reject(error);
            revolve(results);
        });
    });
}

// head controllers

exports.accessHome = (req, res) => {
    res.status(200).json({ message: "Home authorized access", code: "SCS_ACC_HOM"});
};
exports.accessProfil = (req, res) => {
    res.status(200).json({ message: "Profil authorized access", code: "SCS_ACC_PROF" });
};
exports.accessNotif = (req, res) => {
    res.status(200).json({ message: "Notification authorized access", code: "SCS_ACC_NOT" });
};
exports.accessTeam = (req, res) => {
    res.status(200).json({ message: "Team authorized access", code: "SCS_ACC_TEA" });
};
exports.autoLog = (req, res) => {
    res.status(200).json({ message: "Auto authorized access", code: "SCS_AUT_LOG" });
};


// get controllers

exports.getPubs = (req, res) => {
    mysql.query(`select * from publication left join user on authorId=userId ORDER BY time DESC`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        for (let item of results)
            item.text = Buffer.from(item.text).toString();
        res.status(200).json({ results });
    });
};
exports.getComment = (req, res) => {

    mysql.query(`select * from comment left join publication on parentId=pubId left join user on writerId=userId order by comTime desc`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
exports.getNotif = (req, res) => {

    const getNotifQuery = `select * from notif left join comment on fromId=comId left join user on writerId=userId left join publication on parentId = pubId order by comTime desc`;
    mysqlCmd(getNotifQuery)
        .then(results => {
            for (let item of results)
            item.text = Buffer.from(item.text).toString();
            res.status(200).json({ results });
        })
        .catch( error => res.status(500).json({ error }));
};
exports.getUsers = (req, res) => {
    const getUsersQuery = `select * from user`;
    mysqlCmd(getUsersQuery)
        .then(results => {
            res.status(200).json({ results });
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

// post controllers

exports.publish = (req, res) => {
    if (services.isNotEmpty(req.body.publication)) {
        const authorId = req.decoded.userId;
        const text = req.body.publication;
        mysql.query(`insert into publication (authorId, text, time, postLike, postDislike) values ('${authorId}', '${text}', '${services.now()}', 0, 0)`, (error) => {
            if (error)
                return res.status(500).json({ error });
            res.status(201).json({ message: "Publication successfully sent", code: "SCS_PBSH_PUB" });
        });    
    }
    else return res.status(401).json({ error: { message: "Publication is empty", code: "ER_EMP_PUB" } });
};
exports.comment = (req, res) => {

    if (services.isNotEmpty(req.body.comment) && req.body.comText.length <= 255) {
        const writerId = req.decoded.userId;
        const parentId = req.body.parentId;
        const comText = req.body.comText;
        const whereId = req.body.authorId;
        const comTime = services.now();

        const insertCommentQuery = `insert into comment (writerId, parentId, comText, comTime) values (${writerId}, ${parentId}, "${comText}", "${comTime}")`;
        const getComIdQuery = `select last_insert_id() from comment`;

        mysqlCmd(insertCommentQuery)
            .then(() => {
                mysqlCmd(getComIdQuery)
                    .then(results => {
                        if (writerId != whereId) {
                            const fromId = results[0]["last_insert_id()"];
                            const insertNotifQuery = `insert into notif (fromId, whereId, state) values (${fromId}, ${whereId}, "unread")`;
                            mysqlCmd(insertNotifQuery)
                                .then(() => res.status(200).json({ message: "success" }))
                                .catch(error => res.status(500).json({ error }));
                        }
                        else res.status(200).json({ message: "success" });
                    })
                    .catch();
            })
            .catch(error => res.status(500).json({ error }));
    }
    else return res.status(401).json({ error: { message: "Cooment is empty", code: "ER_EMP_COM" } });
};
exports.like = (req, res) => {

    const getLikeQuery = `select postLike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getLikeQuery)
        .then(results => {
            const updateLikeQuery = `update publication set postLike=${++results[0].postLike}, userIdLike="${JSON.stringify(req.body.data.userIdLike)}" where pubId=${req.body.data.pubId}`;
            mysqlCmd(updateLikeQuery)
                .then( (/*success*/) => res.status(200).json({ postLike: results[0].postLike }) )
                .catch( error => res.status(400).json({ error }) );
        })
        .catch( error => res.status(400).json({ error }));
};
exports.dislike = (req, res) => {
    const getDislikeQuery = `select postDislike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getDislikeQuery)
        .then(results => {
        const updateDislikeQuery = `update publication set postDislike=${++results[0].postDislike}, userIdDislike="${JSON.stringify(req.body.data.userIdDislike)}"where pubId=${req.body.data.pubId}`;
            mysqlCmd(updateDislikeQuery)
                .then( (/*success*/) => res.status(200).json({ postDislike: results[0].postDislike }) )
                .catch( error => res.status(400).json({ error }) );
        })
        .catch( error => res.status(400).json({ error }) );
};
exports.unlike = (req, res) => {
    const getLikeQuery = `select postLike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getLikeQuery)
        .then(results => {
            const updateLikeQuery = `update publication set postLike=${--results[0].postLike}, userIdLike="${JSON.stringify(req.body.data.userIdLike)}" where pubId=${req.body.data.pubId}`;
            mysqlCmd(updateLikeQuery)
                .then( (/*success*/) => res.status(200).json({ postLike: results[0].postLike }) )
                .catch( error => res.status(400).json({ error }) );
        })
        .catch( error => res.status(400).json({ error }) );
};
exports.undislike = (req, res) => {
    const getDislikeQuery = `select postDislike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getDislikeQuery)
        .then(results => {
            const updateDislikeQuery = `update publication set postDislike=${--results[0].postDislike}, userIdDislike="${JSON.stringify(req.body.data.userIdDislike)}" where pubId=${req.body.data.pubId}`;
            mysqlCmd(updateDislikeQuery)
                .then((/*success*/) => res.status(200).json({ postDislike: results[0].postDislike }) )
                .catch(error => res.status(400).json({ error }) );
        })
        .catch( error => res.status(400).json({ error }) );
};
exports.uptProfImg = (req, res) => {

    const imgUrl = `${req.protocol}://${req.headers.host}/img/${req.file.filename}`;
    const userData = req.decoded;
    const updateUserQuery = `update user set img="${imgUrl}" where userId="${userData.userId}"`;
    const getUserQuery = `select * from user where email="${req.decoded.email}"`;

    // update user publication and comment tables
    // with user img input
    mysqlCmd(updateUserQuery)
        .then(() => {
            // get user info and refresh token
            mysqlCmd(getUserQuery)
                .then(results => {
                    const data = {
                        token: services.generateTkn(results[0]),
                        imgUrl
                    };
                    res.status(200).json({ data });                                            
                })
                .catch( error => res.status(500).json({ error }) );
        })
        .catch( error => res.status(500).json({ error })) ;
};
exports.uploadImg = (req, res) => {
    const imgUrl = `${req.protocol}://${req.headers.host}/img/${req.file.filename}`;
    res.status(201).json({ imgUrl });
};
exports.token = (req, res) => {

    if (req.body && req.body.tokenRfrsh != null && req.body.tokenRfrsh != undefined) {
        // check token signature and validity 
        const tokenRfrsh = req.body.tokenRfrsh;
        jwt.verify(tokenRfrsh, process.env.SEC_SES_REFRESH, (error, decoded) => {
            if (error) return res.status(401).json({ error });
            // if token refresh is ok 
            else {
                if (req.headers.authorization) {
                    const token = req.headers.authorization.split(" ")[1];
                    const data = {
                        token: services.generateTkn(jwt.decode(token)),
                        tokenRfrsh
                    };
                    req.decoded = decoded;
                    return res.status(201).json({ data });
                }
            }
        });
    }
    else res.status(401).json({ message: "Failed verify token: Bearer token not found", code: "ER_BEA_TKN" });
};

// patch controllers

exports.uptProfDesc = (req, res) => {

    // Empty string is authorized 
    // to delete previous description
    if (req.body.desc.length <= 255) {
        const updateUserQuery = `update user set description="${req.body.desc}" where userId="${req.decoded.userId}"`;
        const getUserQuery = `select * from user where email="${req.decoded.email}"`;
        mysqlCmd(updateUserQuery)
            .then(() => {
                mysqlCmd(getUserQuery)
                    .then(results => {
                        const data = {
                            token: services.generateTkn(results[0]),
                        };
                        res.status(200).json({ data });                
                    })
                    .catch(error => res.status(500).json({ error }) );
            })
            .catch( error => res.status(500).json({ error }) );
    }
};
exports.uptProfPasswd = (req, res) => {
    const getHashPasswdQuery = `select password from user where userId=${req.decoded.userId} `;
    mysqlCmd(getHashPasswdQuery)
        .then(results => {
            const hash = results[0].password;
            bcrypt.compare(req.body.old, hash, (error, ready) => {
                if (error)
                    return res.status(500).json({ error });
                if (!ready)
                    return res.status(401).json({ message: "Password does not match", code: "ER_CHK_PASS" });
                // generate salt for password encryption
                bcrypt.genSalt(10, (error, salt) => {
                    if (error)
                        return res.status(500).json({ error });
                    // generate hash from request  password
                    bcrypt.hash(req.body.new, salt, (error, hash) => {
                        if (error)
                            return res.status(500).json({ error });
                        const modifyPasswdQuery = `update user set password="${hash}" where userId=${req.decoded.userId}`;
                        mysqlCmd(modifyPasswdQuery)
                            .then( () => res.status(200).json({ message: "Password modified successfully", code: "SCS_MDF_PASS" }) )
                            .catch( error => res.status(500).json({ error }) );
                    });
                });    
            });
        })
        .catch(error => res.status(500).json({text: error }) );
};
exports.readNotif = (req, res) => {
    const updateNotifQuery = `update notif set state="read" where notifId=${req.body.notifId}`;
    mysqlCmd(updateNotifQuery)
        .then((/*results*/) => res.status(200).json({ message: "notification read", code: "SCS_REA_NOT" }) )
        .catch( error => res.status(500).json({ error }));
};

// delete controllers

exports.delPublication = (req, res) => {

    const delPubQuery = `delete publication, comment, notif from publication left join comment on pubId = parentId  left join notif on comId = fromId where pubId = ${req.query.pubId}`;
    mysqlCmd(delPubQuery)
        .then(() => res.status(200).json({ message: "Publication successfully deleted", code: "SCS_DEL_PUB" }))
        .catch(error => { return res.status(500).json({ error }); });                    
};
exports.delComment = (req, res) => {

    const delComQuery = `delete comment, notif from comment left join notif on comId = fromId where comId = ${req.query.comId}`;
    mysqlCmd(delComQuery)
        .then(() => res.status(200).json({ message: "Comment successfully deleted", code: "SCS_DEL_COM" }))
        .catch(error => res.status(500).json({ error }));
};
exports.delNotif = (req, res) => {

    const delNotifQuery = `delete from notif where notifId=${req.query.notifId}`;
    mysqlCmd(delNotifQuery)
        .then(results => res.status(200).json({ results }) )
        .catch( error => res.status(500).json({ error }));
    
};
exports.delProfil = (req, res) => {
    const delProfQuery = `delete user, publication, comment, notif from user left join publication on userId=authorId left join comment on userId=writerId left join notif on userId=whereId where userId=${req.query.id}`;
    mysqlCmd(delProfQuery)
        .then( () => res.status(200).json({ message: "Profil deleted successfully", code: "SCS_DEL_PROF" }) )
        .catch( error => res.status(500).json({ error }));    
};

