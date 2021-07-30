require("dotenv").config();

const services = {
    checkEmail: email => {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g.test(email);
    },
    checkField: field => {
        return /^\s*[0-9a-zA-ZÀ-ÿ]{2,}([\s|-]?[0-9a-zA-ZÀ-ÿ]{1,})*\s*$/g.test(field);
    },
    checkPasswd: passwd => {
        let ok = 0;
        const regex = {
            digit: /.*\d.*/g,
            lowercase: /.*[a-z].*/g,
            uppercase: /.*[A-Z].*/g,
            special: /.*[*.!@#$%^&(){}[\]:";'<>,.?/~`_+\-=|\\].*/g,
            space: /.*\s.*/g,
            min8: v => v.length >= 8,
        };
        
        if (regex.min8(passwd)) {
            if( !regex.digit.test(passwd) )
                ok++;
            if( !regex.lowercase.test(passwd))
                ok++;
            if( !regex.uppercase.test(passwd))
                ok++;
            if (!regex.special.test(passwd))
                ok++;
            if (regex.space.test(passwd))
                ok++;
        }
        return !ok ;     
    },
    checkPublication: publication => {
        return !/^\s+$/gi.test(publication);
    },
};

module.exports = services;