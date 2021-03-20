const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const config = require('./config/database');
const api = require('./routes/api');
const db = require('./dbConnect');

//connect to db - switch to pooling?
db.pgClientConnect();
//https://node-postgres.com/api/client


//set up express app
const app = express();

const port = process.env.PORT || 3000;

// middleware
app.use(cors());        //to request web assets from another server
app.use(bodyParser.urlencoded({ extended: true })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// the /users is the path before the pathes specified in users.js
app.use('/api', api);

//set Static folder for front end?
app.use(express.static(path.join(__dirname, 'public')));

// //test: get request / index
// app.get('/',(req, res) => {
//     res.send({'myballs':'true'});
// });

app.get('*',(req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
    console.log('Server starting on port ' + port);
});