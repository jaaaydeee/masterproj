const { client } = require('../dbConnect');
const config = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports.registerUser = function (user, cb) {
    const salt = bcrypt.genSaltSync(10);
    console.log(salt);
    const hash = bcrypt.hashSync(user.Password, salt);
    console.log(hash);

    const values = [
        user.Email, 
        ('StudentID' in user ? user.StudentID : null), 
        ('FacultyID' in user ? user.FacultyID : null), 
        user.FirstName,
        user.LastName,
        hash
    ];
    const query = `
        INSERT INTO "User" ("Email", "StudentID", "FacultyID", "FirstName", "LastName", "Password") 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING "User"."ID", "User"."Email", "User"."StudentID", "User"."FacultyID";
    `;
    console.log(query);

    client.query(query, values).then(res => {
        console.log("query is back");
        console.log(res);
        cb(res.rows, null);
    }).catch(e => {
        cb(null, e);
    });
}

module.exports.validateUser = function (email, pw, cb) {
    const query = `SELECT * FROM "User" WHERE "Email" = '${email}' LIMIT 1;`;
    client.query(query).then(res => {
        if (typeof res.rows !== "undefined" && res.rows.length == 1) {
            const user = res.rows[0];

            //Check password
            const passwordMatch = bcrypt.compareSync(pw, user.Password);
            if (!passwordMatch) {
                cb(false, false, {err: "Password doesn't match"});
            }

            //create JWT token
            const token = jwt.sign(user, config.secret, {
                expiresIn: 604800 // 1 week
            });
            delete user.Password;
            cb(user, "JWT "+token, null);
        } else {
            cb(false, false, {err: "User not found."});
        }
    });
}

module.exports.getFaculty = function (cb) {
    let query = `
        SELECT "FacultyID", "FirstName", "LastName" FROM "User" WHERE "FacultyID" IS NOT NULL;
    `;
    client.query(query, (err, res) => {
        if (err) {
            cb(null, err);
        } else {
            cb(res.rows, null);
        }
    });
}
