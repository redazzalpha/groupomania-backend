const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const services = require('../services/server.service');
const mysql = require('../mysql');


exports.login = (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    
    // check user inputs
    if (services.checkEmail(email) && services.checkPasswd(password)) {
        
        // get hash password from database 
        mysql.query(`select id, pseudo, email, password, rights from user where email="${email}"`, (error, results) => {
            if (error)
                return res.status(500).json({ error });
            
            // check if results contain value(s)
            if (results.length >= 1) {

                // compare hash from database and request body password 
                bcrypt.compare(password, results[0].password, (error, ready) => {

                    // if internal error set response statut to 500
                    if (error)
                        return res.status(500).json({ error });
                    
                    // if password does not match with hash set response statut to 401 and returns invalid message
                    if (!ready)
                        return res.status(401).json({ error: { message: "Invalid password", code: "ER_INV_PASS" } });
                    
                    // set response statut to 200 and return object with userId value and a new token
                    const token = jwt.sign(
                        {
                            id: results[0].id,
                            pseudo: results[0].pseudo,
                            email: results[0].email,
                            password: results[0].password,
                            rights: results[0].rights,
                        },
                        process.env.SEC_SES,
                        { expiresIn: process.env.SEC_SES_LIFE }
                    );
                    const tokenRefresh = jwt.sign({ id: results[0].id }, process.env.SEC_SES_REFRESH, { expiresIn: process.env.SEC_SES_REFRESH_LIFE });
                    const data = {
                        token: token,
                        tokenRefresh: tokenRefresh,
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

    const pseudo = req.body.pseudo; 
    const email = req.body.email;
    const password = req.body.password;
    const rights = "basic";

    // check user inputs
    if (services.checkField(pseudo) && services.checkEmail(email) && services.checkPasswd(password)) {

        // generate salt for password encryption
        bcrypt.genSalt(10, (error, salt) => {

            if (error)
                return res.status(500).json({ error });
            
            // generate hash from request  password
            bcrypt.hash(password, salt, (error, hash) => {

                if (error)
                    return res.status(500).json({ error });
                
                // create new user, replace clear password by hash and save it 
                mysql.query(`insert into user (pseudo, email, password, rights) values ("${pseudo}", "${email}", "${hash}", "${rights}") `, (error) => {

                    if (error)
                        return res.status(500).json({ error });
                    
                    res.status(201).json({ messsage: "New user created successfully", code: "SCS_IN_REG" });
                });
            });

        });
    }
    else return res.status(400).json({ error: { message: "Error: Pseudo, email or password does not match", code: "ER_BAD_PEP" } });
};


