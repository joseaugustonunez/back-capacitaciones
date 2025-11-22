const db = require('../config/db');

const PreguntaModel = {
  listarPorExamen: async (id_examen) => {
    const [rows] = await db.query(
      'SELECT * FROM preguntas WHERE id_examen = ? ORDER BY id ASC',
      [id_examen]
    );
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM preguntas WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  crear: async ({ id_examen, texto, puntaje }) => {
    const [result] = await db.query(
      `INSERT INTO preguntas (id_examen, texto, puntaje)
       VALUES (?, ?, ?)`,
      [id_examen, texto, puntaje || 1]
    );
    return result;
  }
};

module.exports = PreguntaModel;
