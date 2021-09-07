const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        // check token signature and validity 
        jwt.verify(token, process.env.SEC_SES, (error, decoded) => {
            // error on invalid token
            if (error)
                return res.status(401).json({ error });
            // on locked account
            if (decoded.locked)
                return res.status(401).json({ message: 'Error your account is locked', code: 'ER_ACC_LOC' });
            req.decoded = decoded;
            next();
        });
    }
    else res.status(401).json({ message: "Failed verify token: Bearer token not found", code: "ER_BEA_TKN" });
};

module.exports = auth;