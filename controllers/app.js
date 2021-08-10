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

    let imgUrl = `${req.protocol}://${req.headers.host}/img/${req.file.filename}`;
    let userData = req.decoded;
    // update user publication and comment tables
    // with user img input
    mysql.query(`update comment set img="${imgUrl}" where userId="${userData.userId}"`, error => {
        if (error)
            return res.status(500).json({ error });
    });
    // get user info and refresh token
    mysql.query(`select * from user where email="${req.decoded.email}"`, (error, results) => {
        if (error)
            return res.status(500).json({ error });

        //  update user info and refresh token
        const result = results[0];
        const data = {
            token: services.generateTkn(result),
            imgUrl
        };
        res.status(200).json({ data });
    });
};
exports.uptProfDesc = (req, res) => {
    mysql.query(`update user set description="${req.body.description}" where userId="${req.decoded.userId}"`, error => {
        if (error)
            return res.status(500).json({ error });
    });
    mysql.query(`select * from user where email="${req.decoded.email}"`, (error, results) => {
        if (error)
            return res.status(500).json({ error });

        //  update user info and refresh token
        const result = results[0];
        const data = {
            token: services.generateTkn(result),
            tokenRfsh: services.generateTknRfsh(result),
        };
        res.status(200).json({ data });
    });
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

    mysqlCmd(delComQuery)
        .then(() => {
            mysqlCmd(delPubQuery)
                .then(
                    (/*success*/) => res.status(200).json({ message: "Publication successfully deleted", code: "SCS_DEL_PUB" })
                )
                .catch(
                    (error) => res.status(500).json({ error, message: "del pub" })
                );
        })
        .catch(error => { return res.status(500).json({ error, message: "del com" }); });    
};
exports.comment = (req, res) => {
    if (services.isNotEmpty(req.body.comment)) {
        const userId = req.decoded.userId;
        const pseudo = req.decoded.pseudo;
        const img = req.decoded.img;
        const pubId = req.body.pubId;
        const text = req.body.comment;
        mysql.query(`insert into comment (userId, pubId, pseudo, img, text, time) values (${userId}, ${pubId}, "${pseudo}", "${img}", "${text}", "${services.now()}")`, (error) => {
            if (error)
                return res.status(500).json({ error });
            res.status(201).json({ message: "Comment sent successfully", code: "SCS_PST_CMT"});
        });
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
    mysql.query(`delete from comment where comId=${req.body.comId}`, (error) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ message: "Comment successfully deleted", code: "SCS_DEL_COM" });
    });
};
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
        .then(
            results => {
                const updateLikeQuery = `update publication set postLike=${++results[0].postLike}, userIdLike="${JSON.stringify(req.body.data.userIdLike)}" where pubId=${req.body.data.pubId}`;
                    mysqlCmd(updateLikeQuery)
                        .then(
                            (/*success*/) => res.status(200).json({ postLike: results[0].postLike })
                        )
                        .catch(
                            (error) => res.status(400).json({ error })
                        );
                }
            )
        .catch(
            (error) => res.status(400).json({ error })
        );
};
exports.dislike = (req, res) => {    
    const getDislikeQuery = `select postDislike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getDislikeQuery)
        .then(
            results => {
                const updateDislikeQuery = `update publication set postDislike=${++results[0].postDislike}, userIdDislike="${JSON.stringify(req.body.data.userIdDislike)}"where pubId=${req.body.data.pubId}`;
                    mysqlCmd(updateDislikeQuery)
                        .then(
                            (/*success*/) => res.status(200).json({ postDislike: results[0].postDislike })
                        )
                        .catch(
                            (error) => res.status(400).json({ error })
                        );
                }
            )
        .catch(
            (error) => res.status(400).json({ error })
        );
};
exports.unlike = (req, res) => {

    const getLikeQuery = `select postLike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getLikeQuery)
        .then(
            results => {
                const updateLikeQuery = `update publication set postLike=${--results[0].postLike}, userIdLike="${JSON.stringify(req.body.data.userIdLike)}" where pubId=${req.body.data.pubId}`;
                    mysqlCmd(updateLikeQuery)
                        .then(
                            (/*success*/) => res.status(200).json({ postLike: results[0].postLike })
                        )
                        .catch(
                            (error) => res.status(400).json({ error })
                        );
                }
            )
        .catch(
            (error) => res.status(400).json({ error })
        );
};
exports.undislike = (req, res) => {
    const getDislikeQuery = `select postDislike from publication where pubId=${req.body.data.pubId}`;
    mysqlCmd(getDislikeQuery)
        .then(
            results => {
                const updateDislikeQuery = `update publication set postDislike=${--results[0].postDislike}, userIdDislike="${JSON.stringify(req.body.data.userIdDislike)}" where pubId=${req.body.data.pubId}`;
                    mysqlCmd(updateDislikeQuery)
                        .then(
                            (/*success*/) => res.status(200).json({ postDislike: results[0].postDislike })
                        )
                        .catch(
                            (error) => res.status(400).json({ error })
                        );
                }
            )
        .catch(
            (error) => res.status(400).json({ error })
        );
};

