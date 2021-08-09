const jwt = require('jsonwebtoken');
const services = require("../services/server.service");

const auth = (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        // check token signature and validity 
        jwt.verify(token, process.env.SEC_SES, (error, decoded) => {
            // if token is expired
            if (error && error.name === "TokenExpiredError") {
                const decodedTkn = jwt.decode(token);
                // verify refresh token signature and validity
                jwt.verify(decodedTkn.tokenRfsh, process.env.SEC_SES_REFRESH, (error) => {
                    if (error)
                    return res.status(401).json({ error });
                    // refresh token
                    req.token = services.generateTkn(decodedTkn);
                    req.decoded = decodedTkn;
                    next();
                });
            }
            else if (error) {
                return res.status(401).json({ error });
            }
            else {
                req.token = token;
                req.decoded = decoded;
                next();
            }
        });
    }
    else res.status(401).json({ message: "Failed very token: Bearer token not found", code: "ER_BEA_TKN" });
};

module.exports = auth;