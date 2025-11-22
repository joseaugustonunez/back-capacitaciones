const db = require('../config/db');

const RespuestaModel = {
  listarPorUsuarioYExamen: async (id_usuario, id_examen) => {
    const [rows] = await db.query(
      'SELECT * FROM respuestas WHERE id_usuario = ? AND id_examen = ?',
      [id_usuario, id_examen]
    );
    return rows;
  },

  registrar: async ({ id_usuario, id_examen, id_pregunta, id_opcion, puntaje_obtenido }) => {
    const [result] = await db.query(
      `INSERT INTO respuestas (id_usuario, id_examen, id_pregunta, id_opcion, puntaje_obtenido)
       VALUES (?, ?, ?, ?, ?)`,
      [id_usuario, id_examen, id_pregunta, id_opcion, puntaje_obtenido || 0]
    );
    return result;
  }
};

module.exports = RespuestaModel;
