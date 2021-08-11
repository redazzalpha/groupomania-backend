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
    const getNotifQuery = `select notif from user where userId=${req.decoded.userId}`;

    mysqlCmd(getNotifQuery)
        .then(results => {
            let result = results[0];
            result.notif = JSON.parse(result.notif);
            if (result.notif) {
                result.notif = result.notif.filter(item => {
                    return item.where != req.body.pubId;
                });
            }
            const updateNotifQuery = `update user set notif="${JSON.stringify(result.notif)}" where userId=${req.decoded.userId}`;
            mysqlCmd(updateNotifQuery)
                .then(() => {
                    mysqlCmd(delComQuery)
                        .then(() => {
                            mysqlCmd(delPubQuery)
                            .then( () => res.status(200).json({ message: "Publication successfully deleted", code: "SCS_DEL_PUB" }) )
                            .catch( error => res.status(500).json({ error, message: "del pub" }) );
                        })
                        .catch(error => { return res.status(500).json({ error, message: "del com" }); });                    
                })
                .catch(error => res.status(500).json({ error }) );
        })
        .catch(error => res.status(500).json({ error }) );
};
exports.comment = (req, res) => {

    /**
     * This function is used to create Comment
     * To create comment need to insert comment into database
     * then get userId to get notif object from user
     * get notif as map object
     * the first key is the userId 
     * the second key is the pubId 
     * then replace values and reinject map into database
     * 
     */
    if (services.isNotEmpty(req.body.comment)) {
        const userId = req.decoded.userId;
        const pseudo = req.decoded.pseudo;
        const img = req.decoded.img;
        const pubId = req.body.pubId;
        const text = req.body.comment;
        const notif = {
            from: userId,
            where: pubId,
            pseudo,
            img,
        };

        const insertCommentQuery = `insert into comment (userId, pubId, pseudo, img, text, time) values (${userId}, ${pubId}, "${pseudo}", "${img}", "${text}", "${services.now()}")`;
        const getUserIdQuery = `select userId from publication where pubId=${pubId} `;
        let author = 0;

        mysqlCmd(insertCommentQuery)
            .then(() => {
                mysqlCmd(getUserIdQuery)
                    .then(results => {

                        author = results[0].userId;
                        const getNotifQuery = `select notif from user where userId=${author}`;
                        mysqlCmd(getNotifQuery)
                            .then( results => {
                                const user = results[0];
                                user.notif = JSON.parse(user.notif);
                                if (!user.notif)
                                    user.notif = [];
                                user.notif.push(notif);
                                user.notif = JSON.stringify(user.notif);                            
                                const updateNotifQuery = `update user set notif = '${user.notif}' where userId=${author}`;
                                mysqlCmd(updateNotifQuery)
                                    .then( () => res.status(200).json({ message: "success" }) )
                                    .catch(error => res.status(500).json({ error }));
                            })
                            .catch(error => res.status(500).json({ error }));                        
                    })
                    .catch(error => res.status(500).json({ error }) );
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

    const getNotifQuery = `select notif from user where userId=${req.decoded.userId}`;
    const delCommentQuery = `delete from comment where comId=${req.body.comId}`;
    mysqlCmd(getNotifQuery)
        .then(results => {
            let result = results[0];
            result.notif = JSON.parse(result.notif);
            if (result.notif) {
                result.notif = result.notif.filter(item => {
                    return item.where != req.body.pubId;
                });
            }
            result.notif = JSON.stringify(result.notif);
            const updateNotifQuery = `update user set notif="${result.notif}" where userId=${req.decoded.userId}`;
            mysqlCmd(updateNotifQuery)
                .then(() => {
                    mysqlCmd(delCommentQuery)
                        .then(() => res.status(200).json({ message: "Comment successfully deleted", code: "SCS_DEL_COM" }))
                        .catch(error => res.status(500).json({ error }) );
                })
                .catch();
        })
        .catch(error => res.status(500).json({ error }) );    
}
exports.accessNotif = (req, res) => {
    res.status(200).json({ message: "successfully in notification" });
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

