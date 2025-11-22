const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'capacitaciones',
  password: 'G1CaDUHcoC8hwFZrrA00',
  database: 'plataformacapacitaciones',
});

module.exports = db;
