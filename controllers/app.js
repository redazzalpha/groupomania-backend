const mysql = require("../mysql");
const services = require("../services/server.service");

function mysqlCmd(query) {
    return new Promise((revolve, reject) => {
        mysql.query(query, (error, results) => {
            if (error)
                return reject(error);
            revolve(results);
        });
    });
}

exports.accessHome = (req, res) => {

    res.status(200).json({ message: "home authorized access", code: "SCS_ACC_HOM"});
};
exports.accessProfil = (req, res) => {
    res.status(200).json({ message: "profil authorized access", code: "SCS_ACC_PROF" });
};
exports.uptProfImg = (req, res) => {

    const imgUrl = `${req.protocol}://${req.headers.host}/img/${req.file.filename}`;
    const userData = req.decoded;
    const updateUserQuery = `update user set img="${imgUrl}" where userId="${userData.userId}"`;
    const updatePublicationQuery = `update publication set img="${imgUrl}" where userId="${userData.userId}"`;
    const updateCommentQuery = `update comment set img="${imgUrl}" where userId="${userData.userId}"`;
    const getUserQuery = `select * from user where email="${req.decoded.email}"`;

    // update user publication and comment tables
    // with user img input
    mysqlCmd(updateUserQuery)
        .then(() => {
            mysqlCmd(updatePublicationQuery)
                .then(() => {
                    mysqlCmd(updateCommentQuery)
                        .then( () => {
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
                        .catch( error => res.status(500).json({ error }) );

                })
                .catch( error => res.status(500).json({ error }) );
        })
        .catch( error => res.status(500).json({ error })) ;
};
exports.uptProfDesc = (req, res) => {
    // Empty string is authorized 
    // to delete previous description
    if (req.body.description.length <= 255) {
        const updateUserQuery = `update user set description="${req.body.description}" where userId="${req.decoded.userId}"`;
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
    res.status(200).json({ message: "Password updated succesfully", code: "SCS_UPT_PSW" });
};
exports.delAccount = (req, res) => {
    res.status(200).json({ message: "Account deleted successfully", code: "SCS_DEL_ACC" });
};
exports.publish = (req, res) => {
    if (services.isNotEmpty(req.body.publication)) {
        const decoded = req.decoded;
        const userId = decoded.userId;
        const pseudo = decoded.pseudo;
        const img = decoded.img;
        const text = req.body.publication;
        mysql.query(`insert into publication (userId, pseudo, img, text, time, postLike, postDislike) values ("${userId}", "${pseudo}", "${img}", "${text}", "${services.now()}", 0, 0)`, (error) => {
            if (error)
                return res.status(500).json({ error });
            res.status(201).json({ message: "Publication successfully sent", code: "SCS_PBSH_PUB" });
        });    
    }
    else return res.status(401).json({ error: { message: "Publication is empty", code: "ER_EMP_PUB" } });
};
exports.getPublish = (req, res) => {
    mysql.query(`select * from publication ORDER BY time DESC`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
exports.delPublication = (req, res) => {

    const delComQuery = `delete from comment where pubId=${req.body.pubId}`;
    const delPubQuery = `delete from publication where pubId=${req.body.pubId}`;
    const delNotifQuery = `delete from notif where pubId=${req.body.pubId}`; 

    mysqlCmd(delPubQuery)
        .then(() => {
            mysqlCmd(delComQuery)
                .then(() => {
                    mysqlCmd(delNotifQuery)
                        .then( () => res.status(200).json({ message: "Publication successfully deleted", code: "SCS_DEL_PUB" }) )
                        .catch( error => res.status(500).json({ error }) );
                })
                .catch( error => res.status(500).json({ error }) );
        })
        .catch(error => { return res.status(500).json({ error }); });                    
};
exports.comment = (req, res) => {

    if (services.isNotEmpty(req.body.comment) && req.body.comment.length <= 255) {
        const userId = req.decoded.userId;
        const pseudo = req.decoded.pseudo;
        const img = req.decoded.img;
        const text = req.body.comment;
        const pubUserId = req.body.userId;
        const pubId = req.body.pubId;
        const time = services.now();

        const insertCommentQuery = `insert into comment (userId, pubId, pseudo, img, text, time) values (${userId}, ${pubId}, "${pseudo}", "${img}", "${text}", "${time}")`;
        const getComIdQuery = `select last_insert_id() from comment`;

        mysqlCmd(insertCommentQuery)
            .then(() => {
                mysqlCmd(getComIdQuery)
                    .then(results => {
                        if (userId != pubUserId) {
                            const comId = results[0]["last_insert_id()"];
                            const insertNotifQuery = `insert into notif (userId, fromId, pubId, comId, pseudo, img, text, time, state) values (${pubUserId}, ${userId}, ${pubId}, ${comId}, "${pseudo}", "${img}", "${text}", "${time}", "unread")`;
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
exports.getComment = (req, res) => {

    mysql.query(`select * from comment ORDER BY time DESC`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
exports.delComment = (req, res) => {

    const delCommentQuery = `delete from comment where comId=${req.body.comId}`;
    const delNotifQuery = `delete from notif where comId=${req.body.comId}`;

    mysqlCmd(delCommentQuery)
        .then(() => {
            mysqlCmd(delNotifQuery)
                .then(() => res.status(200).json({ message: "Comment successfully deleted", code: "SCS_DEL_COM" }) )
                .catch(error => res.status(500).json({ error }) );
        })
        .catch(error => res.status(500).json({ error }) );
}
exports.accessNotif = (req, res) => {
    res.status(200).json({ message: "successfully in notification" });
};
exports.getNotif = (req, res) => {

    const getNotifQuery = `select * from notif where userId=${req.decoded.userId} ORDER BY time DESC`;
    mysqlCmd(getNotifQuery)
        .then(results => res.status(200).json({ results }) )
        .catch( error => res.status(500).json({ error }));
    
};
exports.readNotif = (req, res) => {

    const updateNotifQuery = `update notif set state="read" where notifId=${req.body.notifId}`;
    mysqlCmd(updateNotifQuery)
        .then((/*results*/) => res.status(200).json({ message: "notification read", code: "SCS_REA_NOT" }) )
        .catch( error => res.status(500).json({ error }));
};
exports.delNotif = (req, res) => {

    const delNotifQuery = `delete from notif where notifId=${req.body.notifId}`;
    mysqlCmd(delNotifQuery)
        .then(results => res.status(200).json({ results }) )
        .catch( error => res.status(500).json({ error }));
    
};
exports.accessTeam = (req, res) => {
    res.status(200).json({ message: "successfully in team" });
};
exports.autoLog = (req, res) => {
    res.status(200).json({data: { token: req.token }});
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

