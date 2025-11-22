const db = require('../config/db');

const OpcionModel = {
  listarPorPregunta: async (id_pregunta) => {
    const [rows] = await db.query(
      'SELECT * FROM opciones WHERE id_pregunta = ? ORDER BY id ASC',
      [id_pregunta]
    );
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM opciones WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  crear: async ({ id_pregunta, texto, es_correcta }) => {
    const [result] = await db.query(
      `INSERT INTO opciones (id_pregunta, texto, es_correcta)
       VALUES (?, ?, ?)`,
      [id_pregunta, texto, es_correcta ? 1 : 0]
    );
    return result;
  },

  actualizar: async (id, { texto, es_correcta }) => {
    const [result] = await db.query(
      `UPDATE opciones SET texto = ?, es_correcta = ? WHERE id = ?`,
      [texto, es_correcta ? 1 : 0, id]
    );
    return result;
  },

  eliminar: async (id) => {
    const [result] = await db.query(`DELETE FROM opciones WHERE id = ?`, [id]);
    return result;
  },
};

module.exports = OpcionModel;
