const http = require('http');
const app = require('./app');
require('dotenv').config();

/**
 *  Function that normalize port 
 * 
 * @function 
 * @param {string | number} val - port value 
 * @returns {boolean | string}
 * 
*/
const normalizePort = val => {

    const port = parseInt(val, 10);

    if (isNaN(port))
        return val;
    if (port >= 0)
        return port;
    return false;
};
/**
 *  Function that handles errors
 * 
 * @function 
 * @param {object} error - object that represents the current error 
 * @throws {error} throws an error if system call is not "listen"
 * 
*/
const errorHandler = error => {

    if (error.syscall != "listen")
        throw error;
    
    switch (error.code) {

        case "EACCES":
            console.error(`${bind} requires root privileges`);
            process.exit(1);
            break;

        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

//create server
const server = http.createServer(app);
const port = normalizePort(process.env.PORT || 4000);
const address = server.address();
const bind = typeof address === "string" ? `pipe ${address}` : `port: ${port}`;
app.set("port", port);

//handle errors
server.on("error", errorHandler);
//server listen
server.listen(port, () => {
    console.log(`server is running at ${bind}`);
});

