const express = require('express');
const path = require('path');
const app = express();
const userRoutes = require('./routes/user');
const appRoutes = require('./routes/app');

// body parser
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json( {limit: '50mb'}));

// headers settings
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content, Content-Type, Origin, Authorization, Origin, Accept");
    res.setHeader("Access-Control-Allow-Methods", "PATCH, GET, PUT, POST, DELETE, OPTIONS");
    next();
});

// routes
app.use("/", userRoutes);
app.use("/app", appRoutes);
app.use("/img", express.static(path.join(__dirname, "img")));





module.exports = app;