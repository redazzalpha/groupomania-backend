const mysql = require("../mysql");
const services = require("../services/server.service");

exports.home = (req, res) => {
    res.status(200).json({ message: "successfully in home" });
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
    const publication = req.body.publication;
    if (services.checkPublication(publication)) {

        const author = req.body.author;
        const text = req.body.publication;
        const pseudo = req.body.pseudo;
                
        // get hash password from database 
        mysql.query(`insert into publication (author, pseudo, text, postLike, postDislike) values ("${author}", "${pseudo}", "${text}", 0, 0)`, (error) => {
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
