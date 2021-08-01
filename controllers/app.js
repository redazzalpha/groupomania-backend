const mysql = require("../mysql");
const jwt = require('jsonwebtoken');
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
    if (services.checkPublication(req.body.publicationn)) {

        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.SEC_SES, (error, decoded) => {

                if (error)
                    return res.status(401).json({ error });
                
                const author = decoded.email;
                const pseudo = decoded.pseudo;
                const img = decoded.img;
                const text = req.body.publication;

                // get hash password from database 
                mysql.query(`insert into publication (author, pseudo, img, text, postLike, postDislike) values ("${author}", "${pseudo}", "${img}", "${text}", 0, 0)`, (error) => {
                    if (error)
                        return res.status(500).json({ error });
                    res.status(201).json({ message: "Publication successfully sent", code: "SCS_PBSH_PUB" });
                });    
            });
        }
        else return res.status(400).json({error: { message: "token autentification failed", code: "ER_JWT_AUTH" }});                
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
