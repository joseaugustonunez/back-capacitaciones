const db = require('../config/db');

const IntentoModel = {
  listarPorUsuarioYExamen: async (id_usuario, id_examen) => {
    const [rows] = await db.query(
      'SELECT * FROM intentos WHERE id_usuario = ? AND id_examen = ? ORDER BY intento_num ASC',
      [id_usuario, id_examen]
    );
    return rows;
  },

  registrar: async ({ id_usuario, id_examen, intento_num, puntaje_total }) => {
    const [result] = await db.query(
      `INSERT INTO intentos (id_usuario, id_examen, intento_num, puntaje_total)
       VALUES (?, ?, ?, ?)`,
      [id_usuario, id_examen, intento_num, puntaje_total || 0]
    );
    return result;
  }
};

module.exports = IntentoModel;
