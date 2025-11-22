const db = require('../config/db');

const TipoInteraccionModel = {

  crear: async (tipo) => {
    const sql = `
      INSERT INTO tipos_interaccion (
        nombre,
        descripcion,
        fecha_creacion
      ) VALUES (?, ?, NOW())
    `;

    const values = [
      tipo.nombre,
      tipo.descripcion || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = 'SELECT * FROM tipos_interaccion ORDER BY nombre ASC';
    const [rows] = await db.query(query);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM tipos_interaccion WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  actualizar: async (id, tipo) => {
    const sql = `
      UPDATE tipos_interaccion
      SET nombre = ?, descripcion = ?
      WHERE id = ?
    `;

    const values = [
      tipo.nombre,
      tipo.descripcion || null,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    const sql = `DELETE FROM tipos_interaccion WHERE id = ?`;
    const [result] = await db.query(sql, [id]);
    return result;
  },

  existePorNombre: async (nombre, idExcluir = null) => {
    let query = 'SELECT COUNT(*) as count FROM tipos_interaccion WHERE nombre = ?';
    let values = [nombre];
    
    if (idExcluir) {
      query += ' AND id != ?';
      values.push(idExcluir);
    }
    const [rows] = await db.query(query, values);
    return rows[0].count > 0;
  }
};

module.exports = TipoInteraccionModel;
