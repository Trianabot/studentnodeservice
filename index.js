const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var path = require('path');
const config = require('./config/config');
const imageUploadRouter = require('./route/imageupload.route');

var app = express();
const http = require("http");

const server = http.Server(app);
app.use(bodyParser.json({ limit: '14mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '14mb', extended: true }));
// Set up mongoose connection
const mongoose = require('mongoose');

let dev_db_url = config.db;
let mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var originsWhitelist = [
    'http://localhost:4200'
];

var corsOptions = {
    origin: function (origin, callback) {
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
    },
    credentials: true
}

//Cors options

app.use(cors(corsOptions));

const studinfo = require('./route/stud.route');
const adminrouteinfo=require('./route/admin.route');


var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization,X-Requested-With');
    next();
}

app.use(allowCrossDomain);

app.use('/user',studinfo);
app.use('/adminroute',adminrouteinfo)
app.use('/uploadProfilePic', imageUploadRouter);
app.use('/mediafiles', express.static("./mediafiles/"));
app.use('/profilePicture', express.static("../SAC_Media/mediafiles/"));
app.use(express.static(path.join(__dirname, 'userProfilePic')));
const portNumber=config.port;
const port = process.env.PORT || portNumber;
server.listen(port, () => {
    console.log(`Server started on port` + port);
});

module.exports = app;