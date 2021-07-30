const passSchema = require('../models/password');

const pass = (req, res, next) => {

    const validate = passSchema.validate(req.body.password);
    if (validate) next();
    else return res.status(401).json({ message: passSchema.validate(req.body.password, {list: true}) });
};


module.exports = pass;