const db = require('../config/db');

const CategoriaModel = {
  crear: async (categoria) => {
    const sql = `
      INSERT INTO categorias_cursos (
        nombre,
        descripcion,
        icono,
        fecha_creacion
      ) VALUES (?, ?, ?, NOW())
    `;

    const values = [
      categoria.nombre,
      categoria.descripcion || null,
      categoria.icono || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = 'SELECT * FROM categorias_cursos ORDER BY nombre ASC';
    const [rows] = await db.query(query);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM categorias_cursos WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  actualizar: async (id, categoria) => {
    const sql = `
      UPDATE categorias_cursos
      SET nombre = ?, descripcion = ?, icono = ?
      WHERE id = ?
    `;

    const values = [
      categoria.nombre,
      categoria.descripcion || null,
      categoria.icono || null,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    const sql = `DELETE FROM categorias_cursos WHERE id = ?`;
    
    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (error) {
      console.error('❌ Modelo: Error en DELETE:', error);
      throw error;
    }
  },

  existePorNombre: async (nombre, idExcluir = null) => {
    let query = 'SELECT COUNT(*) as count FROM categorias_cursos WHERE nombre = ?';
    let values = [nombre];
    
    if (idExcluir) {
      query += ' AND id != ?';
      values.push(idExcluir);
    }
    
    const [rows] = await db.query(query, values);
    return rows[0].count > 0;
  }
};

module.exports = CategoriaModel;