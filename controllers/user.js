const bcrypt = require('bcrypt');
const services = require('../services/server.service');
const mysql = require('../mysql');


exports.login = (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    
    // check user inputs
    if (services.checkEmail(email) && services.checkPasswd(password)) {
        // get hash password from database 
        mysql.query(`select * from user where email="${email}"`, (error, results) => {
            if (error)
                return res.status(500).json({ error });
            // check if results contain value(s)
            if (results.length >= 1) {
                const result = results[0];
                // compare hash from database and request body password 
                bcrypt.compare(password, result.password, (error, ready) => {
                    // if internal error set response statut to 500
                    if (error)
                        return res.status(500).json({ error });
                    // if password does not match with hash set response statut to 401 and returns invalid message
                    if (!ready)
                        return res.status(401).json({ error: { message: "Invalid password", code: "ER_INV_PASS" } });
                    //  send token
                    const data = {
                        token: services.generateTkn(result),
                        tokenRfrsh: services.generateTknRfsh(result),
                    };
                    res.status(200).json({ data });
                });
            }
            else return res.status(404).json({ error: { message: "User was not found", code: "ER_UNK_USER" } });
        });
    }
    else return res.status(401).json({ error: { message: "Check email password failed", code: "ER_CHK_EMP" } });
};
exports.register = (req, res) => {

    if (req.body && req.body.pseudo && req.body.email && req.body.password) {
        const fields = {
            pseudo: req.body.pseudo,
            email: req.body.email,
            password: req.body.password,
            rights: "basic",
            locked: 0,
        };
    
        // check user inputs
        if (services.checkField(fields.pseudo) && services.checkEmail(fields.email) && services.checkPasswd(fields.password)) {
    
            // generate salt for password encryption
            bcrypt.genSalt(10, (error, salt) => {
    
                if (error)
                    return res.status(500).json({ error });
                
                // generate hash from request  password
                bcrypt.hash(fields.password, salt, (error, hash) => {
    
                    if (error)
                        return res.status(500).json({ error });
                    
                    // create new user, replace clear password by hash and save it 
                    mysql.query(`insert into user (pseudo, email, password, rights, locked) values ("${fields.pseudo}", "${fields.email}", "${hash}", "${fields.rights}", "${fields.locked}") `, (error) => {
    
                        if (error)
                            return res.status(500).json({ error });                    
                        res.status(201).json({ messsage: "New user created successfully", code: "SCS_IN_REG" });
                    });
                });
    
            });
        }
        else return res.status(400).json({ error: { message: "Error: Pseudo, email or password does not match", code: "ER_BAD_PEP" } });
    }
    else res.status(500).json({ message: "Bad query error", code: "ER_BAD_QUE" });
};


