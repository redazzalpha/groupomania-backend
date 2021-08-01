const mysql = require("../mysql");
const services = require("../services/server.service");

exports.home = (req, res) => {
    res.status(200).json(req.decoded);
};
exports.profil = (req, res) => {
    res.status(200).json({ message: "successfully in profil" });
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
        const userId = decoded.id;
        const pseudo = decoded.pseudo;
        const img = decoded.img;
        const text = req.body.publication;

        mysql.query(`insert into publication (userId, pseudo, img, text, postLike, postDislike) values ("${userId}", "${pseudo}", "${img}", "${text}", 0, 0)`, (error) => {
            if (error)
                return res.status(500).json({ error });
            res.status(201).json({ message: "Publication successfully sent", code: "SCS_PBSH_PUB" });
        });    
    }
    else return res.status(401).json({ error: { message: "Publication is empty", code: "ER_EMP_PUB" } });
};
exports.getPublish = (req, res) => {
    // get publications
    mysql.query(`select * from publication`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });
};
exports.comment = (req, res) => {

    const pubId = req.body.pubId;
    const id = req.decoded.id;
    const text = req.body.text;

    mysql.query(`insert into comment (id, pubId, text) values (${pubId}, ${id}, "${text}")`, (error, results) => {
        if (error)
            return res.status(500).json({ error });
        res.status(200).json({ results });
    });

    res.status(200).json({ message: "Comment sent successfully", code: "SCS_PST_CMT"});
};
