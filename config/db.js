const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'capacitaciones', //localhost
  password: 'G1CaDUHcoC8hwFZrrA00',
  database: 'plataformacapacitaciones', //plataforma_capacitaciones
});

module.exports = db;
