const mysql = require("../mysql");
const bcrypt = require("bcrypt");
const services = require("../services/server.service");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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
    mysql.query(`select publication.*, user.userId, user.pseudo, user.img from publication left join user on authorId=userId ORDER BY time DESC limit 2`, (error, results) => {
       if (error)
           return res.status(500).json({ error });
       res.status(200).json({ results });
    });
};
exports.getUserPubs = (req, res) => {

    mysql.query(`select img, publication.* from user left join publication on userId=authorId where userId=${req.query.id} ORDER BY time DESC`, (error, results) => {
       if (error)
           return res.status(500).json({ error });
       res.status(200).json({ results });
    });
};
exports.getComment = (req, res) => {
    mysql.query(`select comment.*, publication.*, user.userId, user.pseudo, user.img from comment left join publication on parentId=pubId left join user on writerId=userId order by comTime desc`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
exports.getNotif = (req, res) => {
    const getNotifQuery = `select comment.*, user.userId, user.pseudo, user.img, publication.* from notif left join comment on fromId=comId left join user on writerId=userId left join publication on parentId = pubId order by comTime desc`;
    mysqlCmd(getNotifQuery)
        .then(results => res.status(200).json({ results }) )
        .catch( error => res.status(500).json({ error }));
};
exports.getUsers = (req, res) => {
    const getUsersQuery = `select userId, pseudo, img, description, rights, locked from user ORDER by pseudo`;
    mysqlCmd(getUsersQuery)
        .then(results => res.status(200).json({ results }) )
        .catch( error => res.status(500).json({ error }));
};
exports.pubScroll = (req, res) => {
    const lpubid = req.query.lpubid.id;
    const condition = lpubid != 0 ? `where pubId < ${lpubid}` : '';
    const scrollQuerry = `select publication.*, user.userId, user.pseudo, user.img from publication left join user on authorId=userId  ${condition}  ORDER BY time DESC limit 2`;
    mysql.query(scrollQuerry, (error, results) => {

        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};

// post controllers

exports.publish = (req, res) => {
    if (req.body && services.isNotEmpty(req.body.publication)) {
        const authorId = req.decoded.userId;
        let text = req.body.publication;
        // dom will be used to recreate dom element for publications images
        const dom = new JSDOM(text);
        const tab = dom.window.document.getElementsByTagName("img");
        let imgUrl = "";
        // mem will be used to store image file paths
        let mem = [];
        const errorHandler = error => {
            if (error)
                return res.status(500).json({ error });
        };

        // loop to write image on server and add image src attribute to created dom 
        for (let img of tab) {
            const matches = img.src.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            let buffer = {};
            if (matches.length !== 3)
                return res.status(500).json({message: 'Invalid image data', code: "ER_INV_IMG"});
            // create buffer from base64 data image url
            buffer.type = matches[1];
            buffer.data = Buffer.from(matches[2], 'base64');
            // create file path and image url
            // imgUrl will be used as the server path of the image file, 
            // in particular for the src attribute
            const filePath = `img/pubs/${authorId}_${Date.now()}`;
            imgUrl = `${req.protocol}://${req.headers.host}/${filePath}`;
            // write image file on server
            fs.writeFile(filePath, buffer.data, errorHandler);
            // set src attribute of img html element
            img.src = imgUrl;
            // store file path into mem array 
            mem.push(filePath);
        }
        // reset publication text with inserted image server path into src attribute of img html element
        text = dom.window.document.body.innerHTML;

        const publishQuery = `insert into publication (authorId, text, time, postLike, postDislike) values ('${authorId}', '${text}', '${services.now()}', 0, 0)`;
        const getPubId = `select last_insert_id() from publication`;

        mysqlCmd(publishQuery)
            .then(() => {
                mysqlCmd(getPubId)
                    // async callback on then() required to loop 
                    // mysql commands
                    .then(async results => {
                        const pubId = results[0]["last_insert_id()"];
                        // loop fto insert 
                        for (let url of mem) {
                            let setPicsQuery = `insert into picture (whoId, path) values (${pubId}, "${url}")`;
                            let result = await mysqlCmd(setPicsQuery);
                            if (result.error) return res.status(500).json({ error: result.error });
                        }
                        return res.status(201).json({ message: "Publication successfully sent", code: "SCS_PBSH_PUB" });
                    })
                    .catch(error => res.status(500).json({ error }));
            })
            .catch(error => res.status(500).json({ error }));
    }
    else return res.status(401).json({ error: { message: "Publication is empty", code: "ER_EMP_PUB" } });
};
exports.comment = (req, res) => {
    if (req.body && services.isNotEmpty(req.body.comment) && req.body.comText.length <= 255) {
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
                                .then( res.status(200).json({ message: "Notification created successfully", code: 'SCS_CRE_NOT' }) )
                                .catch(error => res.status(500).json({ error }));
                        }
                        else res.status(200).json({ message: "Server success action", code: 'SCS_ON_SER' });
                    })
                    .catch();
            })
            .catch(error => res.status(500).json({ error }));
    }
    else return res.status(401).json({ error: { message: "Comment is empty", code: "ER_EMP_COM" } });
};
exports.like = (req, res) => {
    if (req.body && req.body.data && req.body.data.pubId) {
        const getLikeQuery = `select postLike from publication where pubId=${req.body.data.pubId}`;
        mysqlCmd(getLikeQuery)
            .then(results => {
                const updateLikeQuery = `update publication set postLike=${++results[0].postLike}, userIdLike="${JSON.stringify(req.body.data.userIdLike)}" where pubId=${req.body.data.pubId}`;
                mysqlCmd(updateLikeQuery)
                    .then( (/*success*/) => res.status(200).json({ postLike: results[0].postLike }) )
                    .catch( error => res.status(400).json({ error }) );
            })
            .catch( error => res.status(400).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.dislike = (req, res) => {
    if (req.body && req.body.data && req.body.data.pubId) {
        const getDislikeQuery = `select postDislike from publication where pubId=${req.body.data.pubId}`;
        mysqlCmd(getDislikeQuery)
            .then(results => {
            const updateDislikeQuery = `update publication set postDislike=${++results[0].postDislike}, userIdDislike="${JSON.stringify(req.body.data.userIdDislike)}"where pubId=${req.body.data.pubId}`;
                mysqlCmd(updateDislikeQuery)
                    .then( (/*success*/) => res.status(200).json({ postDislike: results[0].postDislike }) )
                    .catch( error => res.status(400).json({ error }) );
            })
            .catch( error => res.status(400).json({ error }) );
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.unlike = (req, res) => {
    if (req.body && req.body.data && req.body.data.pubId) {
        const getLikeQuery = `select postLike from publication where pubId=${req.body.data.pubId}`;
        mysqlCmd(getLikeQuery)
            .then(results => {
                const updateLikeQuery = `update publication set postLike=${--results[0].postLike}, userIdLike="${JSON.stringify(req.body.data.userIdLike)}" where pubId=${req.body.data.pubId}`;
                mysqlCmd(updateLikeQuery)
                    .then( (/*success*/) => res.status(200).json({ postLike: results[0].postLike }) )
                    .catch( error => res.status(400).json({ error }) );
            })
            .catch( error => res.status(400).json({ error }) );
    }
};
exports.undislike = (req, res) => {
    if (req.body && req.body.data && req.body.data.pubId) {
        const getDislikeQuery = `select postDislike from publication where pubId=${req.body.data.pubId}`;
        mysqlCmd(getDislikeQuery)
            .then(results => {
                const updateDislikeQuery = `update publication set postDislike=${--results[0].postDislike}, userIdDislike="${JSON.stringify(req.body.data.userIdDislike)}" where pubId=${req.body.data.pubId}`;
                mysqlCmd(updateDislikeQuery)
                    .then((/*success*/) => res.status(200).json({ postDislike: results[0].postDislike }) )
                    .catch(error => res.status(400).json({ error }) );
            })
            .catch( error => res.status(400).json({ error }) );
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.uptProfImg = (req, res) => {
    if (req.file) {
        const imgUrl = `${req.protocol}://${req.headers.host}/img/${req.file.filename}`;
        const updateUserQuery = `update user set img="${imgUrl}" where userId="${req.decoded.userId}"`;
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
                        if (req.decoded.img) {
                            const file = `img/${req.decoded.img.split("img/")[1]}`;
                            fs.unlink(file, () => {});
                        }
                        res.status(200).json({ data });                                            
                    })
                    .catch( error => res.status(500).json({ error }) );
            })
            .catch( error => res.status(500).json({ error })) ;
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.profMode = (req, res) => {
    if (req.body && (req.body.dark == 0 || req.body.dark == 1)) {
        const setModeQuery = `update user set dark=${req.body.dark} where userId=${req.decoded.userId}`;
        mysqlCmd(setModeQuery)
            .then(() => res.status(200).json({ message: "Mode set successfully", code: 'SCS_SET_MOD' }) )
            .catch(error => res.status(500).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.token = (req, res) => {
    if (req.body && req.body.tokenRfrsh && req.body.tokenRfrsh) {
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
    if (req.body && req.body.desc && req.body.desc.length <= 255) {
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
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.uptProfPasswd = (req, res) => {
    if (req.body && req.body.old && req.body.new) {
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
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.readNotif = (req, res) => {
    if (req.body && req.body.notifId) {
        const getWhereIdQuery = ` select whereId from notif where notifId=${req.body.notifId}`;
        mysqlCmd(getWhereIdQuery)
            .then(results => {
                if (results[0].whereId == req.decoded.userId) {
                    const updateNotifQuery = `update notif set state="read" where notifId=${req.body.notifId}`;
                    mysqlCmd(updateNotifQuery)
                        .then((/*results*/) => res.status(200).json({ message: "notification read", code: "SCS_REA_NOT" }))
                        .catch(error => res.status(500).json({ error }));
                }
                else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
            })
            .catch( error => res.status(500).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.readAll = async (req, res) => {
    if (req.body && req.body.notifId) {
        const getWhereIdQuery = ` select whereId from notif where notifId=${req.body.notifId}`;
        mysqlCmd(getWhereIdQuery)
            .then(results => {
                if (results[0].whereId == req.decoded.userId) {
                    const readNotifQuery = `update notif set state="read" where whereId=${req.decoded.userId}`;
                    mysqlCmd(readNotifQuery)
                        .then( () => res.status(200).json({ message: "All notifs state read successfully", code: "SCS_RA_NTF" }))
                        .catch( error => res.status(500).json({ error }));
                }
                else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
            })
            .catch( error => res.status(500).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });

};
exports.deleteAll = (req, res) => {
    if (req.body && req.body.notifId) {
        const getWhereIdQuery = ` select whereId from notif where notifId=${req.body.notifId}`;
        mysqlCmd(getWhereIdQuery)
            .then(results => {
                if (results[0].whereId == req.decoded.userId) {
                    const delNotifQuery = `delete from notif where whereId=${req.decoded.userId}`;
                    mysqlCmd(delNotifQuery)
                        .then( () => res.status(200).json({ message: "All notifs has been deleted successfully", code: "SCS_DA_NTF" }))
                        .catch( error => res.status(500).json({ error }));
                }
                else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
            })
            .catch( error => res.status(500).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.superUser = (req, res) => {
    if (req.body && req.body.id) {
        const getRightsQuery = ` select rights from user where userId=${req.decoded.userId}`;
        mysqlCmd(getRightsQuery)
            .then(results => {
                if (results[0].rights == 'super') {
                    const superUserQuery = `update user set rights="super" where userId=${req.body.id}`;
                    mysqlCmd(superUserQuery)
                        .then( () => res.status(200).json({message: "User has been set to super user successfully", code: "SCS_RIG_SUP"}))
                        .catch( error => res.status(500).json({ error }));
                }
                else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
            })
            .catch( error => res.status(500).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.revokeSuperUser = (req, res) => {
    if (req.body && req.body.id) {
        const getRightsQuery = ` select rights from user where userId=${req.decoded.userId}`;
        mysqlCmd(getRightsQuery)
            .then(results => {
                if (results[0].rights == 'super') {
                    const superUserQuery = `update user set rights="basic" where userId=${req.body.id}`;
                    mysqlCmd(superUserQuery)
                        .then( () => res.status(200).json({message: "User has been set to basic user successfully", code: "SCS_RIG_BAS"}))
                        .catch( error => res.status(500).json({ error }));
                }
                else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
            })
            .catch( error => res.status(500).json({ error }));
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.lockUser = (req, res) => {
    if (req.body && req.body.id) {
        if (req.decoded.rights == 'super') {
            const blockUserQuery = `update user set locked=1 where userId=${req.body.id}`;
            mysqlCmd(blockUserQuery)
                .then(() => res.status(200).json({message: 'User successfully locked', code: 'SCS_USR_LOC'}))
                .catch( error => res.status(500).json({ error }));
        }
        else return res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};
exports.unlockUser = (req, res) => {
    if (req.body && req.body.id) {
        if (req.decoded.rights == 'super') {
            const blockUserQuery = `update user set locked=0 where userId=${req.body.id}`;
            mysqlCmd(blockUserQuery)
                .then(() => res.status(200).json({message: 'User successfully unlocked', code: 'SCS_USR_ULC'}))
                .catch( error => res.status(500).json({ error }));
        }
        else return res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};

// delete controllers

exports.delPublication = (req, res) => {
    const getAuthorIdQuery = `select authorId from publication where pubId=${req.query.pubId}`;
    mysqlCmd(getAuthorIdQuery)
        .then(results => {
            if (results[0].authorId == req.decoded.userId || req.decoded.rights == 'super') {
                const getPathImgsQuery = `select path from publication left join picture on pubId = whoId where pubId = ${req.query.pubId}`;
                const delPubQuery = `delete publication, picture, comment, notif from publication left join picture on pubId = whoId left join comment on pubId = parentId  left join notif on comId = fromId where pubId = ${req.query.pubId}`;
                const errorHandler = (error) => { if(error) console.error(error); };
                
                mysqlCmd(getPathImgsQuery)
                    .then(results => {
                        mysqlCmd(delPubQuery)
                            .then(() => {
                                for (let item of results) {
                                    if(item.path != null)
                                        fs.unlink(item.path, errorHandler);
                                }
                                res.status(200).json({ message: "Publication successfully deleted", code: "SCS_DEL_PUB" });
                            })
                            .catch(error => { return res.status(500).json({ error }); });                    
                    })
                    .catch(error => { return res.status(500).json({ error }); });                    
            }
            else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
        })
        .catch( error => res.status(500).json({ error }));
};
exports.delComment = (req, res) => {
    const getWhereIdQuery = `select writerId from comment where comId=${req.query.comId}`;
    mysqlCmd(getWhereIdQuery)
        .then(results => {
            if (results[0].writerId == req.decoded.userId || req.decoded.rights == 'super') {
                const delComQuery = `delete comment, notif from comment left join notif on comId = fromId where comId = ${req.query.comId}`;
                mysqlCmd(delComQuery)
                    .then(() => res.status(200).json({ message: "Comment successfully deleted", code: "SCS_DEL_COM" }))
                    .catch(error => res.status(500).json({ error }));
            }
            else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
        })
        .catch( error => res.status(500).json({ error }));
};
exports.delNotif = (req, res) => {
    const getWhereIdQuery = `select whereId from notif where notifId=${req.query.notifId}`;
    mysqlCmd(getWhereIdQuery)
        .then(results => {
            if (results[0].whereId == req.decoded.userId) {
                const delNotifQuery = `delete from notif where notifId=${req.query.notifId}`;
                mysqlCmd(delNotifQuery)
                    .then(results => res.status(200).json({ results }) )
                    .catch( error => res.status(500).json({ error }));
            }
            else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
        })
        .catch( error => res.status(500).json({ error }));  
};
exports.delAccount = (req, res) => {
    if (req.query.id == req.decoded.userId) {
        const getPathImgsQuery = `select path from user left join publication on userId = authorId left join picture on pubId = whoId where userId = ${req.query.id}`;
        const delAccQuery = `delete user, publication, picture, comment, notif from user left join publication on userId=authorId left join picture on pubId=whoId left join comment on userId=writerId left join notif on userId=whereId where userId=${req.query.id}`;
        const errorHandler = (error) => { if (error) console.error(error); };
    
        mysqlCmd(getPathImgsQuery)
            .then(results => {
                mysqlCmd(delAccQuery)
                    .then(() => {
                        const file = `img/${req.decoded.img.split("img/")[1]}`;
                        fs.unlink(file, errorHandler);
                        
        
                        for (let item of results) {
                            if (item.path != null)
                                fs.unlink(item.path, errorHandler);
                        }
                        res.status(200).json({ message: "Profil deleted successfully", code: "SCS_DEL_ACC" });
                    })
                    .catch(error => { return res.status(500).json({ error }); });
            })
            .catch(error => { return res.status(500).json({ error }); });
    }
    else res.status(401).json({ message: "You are not authorize to do this action", code: "ER_FAK_USE" });
};

