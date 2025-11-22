const db = require('../config/db');

const ProgresoModel = {
  crear: async (progreso) => {
    const sql = `
      INSERT INTO progreso_videos (
        id_usuario,
        id_video,
        segundos_vistos,
        completado,
        ultima_visualizacion
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      progreso.id_usuario,
      progreso.id_video,
      progreso.segundos_vistos ?? 0,
      progreso.completado ?? 0,
      progreso.ultima_visualizacion ?? new Date()
    ];
    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = 'SELECT * FROM progreso_videos ORDER BY ultima_visualizacion DESC';
    const [rows] = await db.query(query);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM progreso_videos WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  buscarPorUsuarioYVideo: async (idUsuario, idVideo) => {
    const sql = `
      SELECT * FROM progreso_videos 
      WHERE id_usuario = ? AND id_video = ?
      ORDER BY ultima_visualizacion DESC
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [idUsuario, idVideo]);
    return rows.length > 0 ? rows[0] : null;
  },

  buscarPorUsuario: async (idUsuario) => {
    const sql = `
      SELECT pv.*, v.titulo as titulo_video, v.duracion_segundos
      FROM progreso_videos pv
      LEFT JOIN videos v ON pv.id_video = v.id
      WHERE pv.id_usuario = ?
      ORDER BY pv.ultima_visualizacion DESC
    `;
    const [rows] = await db.query(sql, [idUsuario]);
    return rows;
  },

 actualizar: async (id, progreso) => {
  const sql = `
    UPDATE progreso_videos
    SET id_usuario = ?,
        id_video = ?,
        segundos_vistos = ?,
        completado = ?,
        ultima_visualizacion = ?
    WHERE id = ?
  `;
  const values = [
    progreso.id_usuario,
    progreso.id_video,
    progreso.segundos_vistos,
    progreso.completado,
    progreso.ultima_visualizacion ?? new Date(),
    id
  ];

  const [result] = await db.query(sql, values);
  return result;
},
obtenerUltimoCompletadoPorCurso: async (idUsuario, idCurso) => {
    const sql = `
      SELECT v.id, v.indice_orden
      FROM progreso_videos pv
      INNER JOIN videos v ON pv.id_video = v.id
      INNER JOIN modulos_curso mc ON v.id_modulo = mc.id
      WHERE pv.id_usuario = ? 
      AND mc.id_curso = ? 
      AND pv.completado = 1
      ORDER BY v.indice_orden DESC
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [idUsuario, idCurso]);
    return rows.length > 0 ? rows[0] : null;
  },


  elimina: async (id) => {
    const sql = `DELETE FROM progreso_videos WHERE id = ?`;
    const [result] = await db.query(sql, [id]);
    return result;
  }
};

module.exports = ProgresoModel;