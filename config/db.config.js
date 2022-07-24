const mysql = require("mysql");
require("dotenv/config")
// connection mysql
const dbConn = mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_DATABASE, 
    multipleStatements:false
})


const pool = mysql.createPool({
    connectionLimit: 25,
    password:process.env.DB_PASSWORD,
    user:process.env.DB_USER,
    database:process.env.DB_DATABASE, 
    host:process.env.DB_HOST,
    port: "3306"
});




// dbConn.connect(function(err){
//     if(err) throw err;
//     console.log('Base de données connectée !');
// })

module.exports = pool;