const { Client, Pool } = require('pg');

//const pool = new Pool();
//const client = await pool.connect();
// const client = new Client({
//     user: "postgres",
//     host: "localhost",
//     database: "toro",
//     password: "password",
//     port: 5432 //3188
// });
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

const pgClientConnect = function () {
    return client.connect();
}


//what is a ppol and should i be using it?
module.exports = { client, pgClientConnect }