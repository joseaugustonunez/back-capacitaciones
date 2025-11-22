const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'capacitaciones', //localhost
  password: 'Q44QlT1ykOVc5Y4Y9gh2',
  database: 'plataformaCapacitaciones', //plataforma_capacitaciones
});

module.exports = db;
