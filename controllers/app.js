const mysql = require("../mysql");
const services = require("../services/server.service");

exports.home = (req, res) => {
    res.status(200).json(req.decoded);
};
exports.profil = (req, res) => {
    res.status(200).json(req.decoded);
};
exports.profilImg = (req, res) => {

    let imgUrl = `${req.protocol}://${req.headers.host}/img/${req.file.filename}`;
    let userData = req.decoded;
    // update user publication and comment tables
    // with user img input
    mysql.query(`update user set img="${imgUrl}" where userId="${userData.userId}"`, error => {
        if (error)
            return res.status(500).json({ error });
    });
    mysql.query(`update publication set img="${imgUrl}" where userId="${userData.userId}"`, error => {
        if (error)
            return res.status(500).json({ error });
    });
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
            tokenRfsh: services.generateTknRfsh(result),
            imgUrl
        };
        res.status(200).json({ data });
    });
};
exports.description = (req, res) => {
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
exports.password = (req, res) => {
    res.status(200).json(req.decoded);
};
exports.account = (req, res) => {
    res.status(200).json(req.decoded);
};
exports.notification = (req, res) => {
    res.status(200).json({ message: "successfully in notification" });
};
exports.team = (req, res) => {
    res.status(200).json({ message: "successfully in team" });
};
exports.publish = (req, res) => {
    if (services.checkPublication(req.body.publication)) {

        const decoded = req.decoded;
        const userId = decoded.userId;
        const pseudo = decoded.pseudo;
        const img = decoded.img;
        const text = req.body.publication;

        mysql.query(`insert into publication (userId, pseudo, img, text, time, postLike, postDislike) values ("${userId}", "${pseudo}", "${img}", "${text}", now(), 0, 0)`, (error) => {
            if (error)
                return res.status(500).json({ error });
            res.status(201).json({ message: "Publication successfully sent", code: "SCS_PBSH_PUB" });
        });    
    }
    else return res.status(401).json({ error: { message: "Publication is empty", code: "ER_EMP_PUB" } });
};
exports.getPublish = (req, res) => {
    mysql.query(`select * from publication`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
exports.comment = (req, res) => {

    const userId = req.decoded.userId;
    const pseudo = req.decoded.pseudo;
    const img = req.decoded.img;
    const pubId = req.body.pubId;
    const text = req.body.text;

    mysql.query(`insert into comment (userId, pubId, pseudo, img, text, time) values (${userId}, ${pubId}, "${pseudo}", "${img}", "${text}", now())`, (error) => {
        if (error)
            return res.status(500).json({ error });
        res.status(201).json({ message: "Comment sent successfully", code: "SCS_PST_CMT"});
    });

};
exports.getComment = (req, res) => {

    mysql.query(`select * from comment`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
