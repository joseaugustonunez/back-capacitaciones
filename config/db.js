const mysql = require('mysql2/promise');

 const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root', //localhost  capacitaciones
  password: '', //Q44QlT1ykOVc5Y4Y9gh2
  database: 'plataforma_capacitaciones', //plataforma_capacitaciones plataformaCapacitaciones
}); 
/* const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'capacitaciones', //localhost  capacitaciones
  password: 'Q44QlT1ykOVc5Y4Y9gh2', //Q44QlT1ykOVc5Y4Y9gh2
  database: 'plataformaCapacitaciones', //plataforma_capacitaciones plataformaCapacitaciones
}); */
module.exports = db;
