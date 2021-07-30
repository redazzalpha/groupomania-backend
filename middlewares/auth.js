const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.SEC_SES, error => {
            if (error)
                return res.status(401).json({ error });
            next();
        });
    }
    else return res.status(400).json({error: { message: "token autentification failed", code: "ER_JWT_AUTH" }});
};

module.exports = auth;