const db = require('../config/db');

const ExamenModel = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM examenes ORDER BY fecha_creacion DESC');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM examenes WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  crear: async ({ id_modulo, titulo, intentos_permitidos, puntaje_minimo_aprobacion, es_obligatorio }) => {
    const [result] = await db.query(
      `INSERT INTO examenes (id_modulo, titulo, intentos_permitidos, puntaje_minimo_aprobacion, es_obligatorio)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_modulo,
        titulo,
        typeof intentos_permitidos !== 'undefined' ? intentos_permitidos : 1,
        typeof puntaje_minimo_aprobacion !== 'undefined' ? puntaje_minimo_aprobacion : 0.0,
        typeof es_obligatorio !== 'undefined' ? (es_obligatorio ? 1 : 0) : 0,
      ]
    );
    return result;
  },

  actualizar: async (id, { titulo, intentos_permitidos, puntaje_minimo_aprobacion, es_obligatorio }) => {
    const [result] = await db.query(
      `UPDATE examenes SET titulo = ?, intentos_permitidos = ?, puntaje_minimo_aprobacion = ?, es_obligatorio = ? WHERE id = ?`,
      [
        titulo,
        typeof intentos_permitidos !== 'undefined' ? intentos_permitidos : 1,
        typeof puntaje_minimo_aprobacion !== 'undefined' ? puntaje_minimo_aprobacion : 0.0,
        typeof es_obligatorio !== 'undefined' ? (es_obligatorio ? 1 : 0) : 0,
        id,
      ]
    );
    return result;
  },

  eliminar: async (id) => {
    // Borra opciones -> preguntas -> examen
    // 1) eliminar opciones relacionadas (JOIN)
    await db.query(
      `DELETE opciones FROM opciones
       JOIN preguntas ON opciones.id_pregunta = preguntas.id
       WHERE preguntas.id_examen = ?`,
      [id]
    );

    // 2) eliminar preguntas del examen
    await db.query(`DELETE FROM preguntas WHERE id_examen = ?`, [id]);

    // 3) eliminar examen
    const [result] = await db.query(`DELETE FROM examenes WHERE id = ?`, [id]);
    return result;
  },
};

module.exports = ExamenModel;
