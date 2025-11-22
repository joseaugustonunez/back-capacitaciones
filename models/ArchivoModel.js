const db = require('../config/db');

const ArchivoModel = {
  crear: async (archivo) => {
    const sql = `
      INSERT INTO archivos_modulo (
        id_modulo,
        nombre_archivo,
        url_archivo,
        descripcion,
        fecha_subida
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const values = [
      archivo.id_modulo,
      archivo.nombre_archivo,
      archivo.url_archivo,
      archivo.descripcion || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = `
      SELECT a.*, m.nombre AS nombre_modulo
      FROM archivos_modulo a
      LEFT JOIN modulos m ON a.id_modulo = m.id
      ORDER BY a.fecha_subida DESC
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM archivos_modulo WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  listarPorModulo: async (id_modulo) => {
    const sql = `
      SELECT * FROM archivos_modulo
      WHERE id_modulo = ?
      ORDER BY fecha_subida DESC
    `;
    const [rows] = await db.query(sql, [id_modulo]);
    return rows;
  },

  actualizar: async (id, archivo) => {
    const sql = `
      UPDATE archivos_modulo
      SET id_modulo = ?, nombre_archivo = ?, url_archivo = ?, descripcion = ?
      WHERE id = ?
    `;

    const values = [
      archivo.id_modulo,
      archivo.nombre_archivo,
      archivo.url_archivo,
      archivo.descripcion || null,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    const sql = `DELETE FROM archivos_modulo WHERE id = ?`;
    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (error) {
      console.error('❌ Modelo: Error en DELETE archivos_modulo:', error);
      throw error;
    }
  }
};

module.exports = ArchivoModel;
