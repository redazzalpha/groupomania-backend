const mysql = require('mysql2');

// create mysql connection
const connection = mysql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWD,
    database: process.env.SQL_DB,
    charset: process.env.SQL_CHARSET,
});

connection.connect(error => {
    if (error)
        throw error;
});

module.exports = connection;

