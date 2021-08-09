const tokenConfig = (req, res, next) => {

    res.token = req.token;
    next();
};

module.exports = tokenConfig;