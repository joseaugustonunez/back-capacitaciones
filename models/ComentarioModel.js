const db = require('../config/db');

const ComentarioModel = {
  crear: async (comentario) => {
    const sql = `
      INSERT INTO comentarios_videos (
        id_usuario,
        id_video,
        id_comentario_padre,
        texto_comentario,
        marca_tiempo_segundos,
        esta_activo,
        fecha_creacion,
        fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;

    const values = [
      comentario.id_usuario,
      comentario.id_video,
      comentario.id_comentario_padre || null,
      comentario.texto_comentario,
      comentario.marca_tiempo_segundos || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

listarPorVideo: async (id_video) => {
  const sql = `
    SELECT c.id,
           c.id_usuario,
           c.id_video,
           c.id_comentario_padre,
           c.texto_comentario,
           c.marca_tiempo_segundos,
           c.esta_activo,
           c.fecha_creacion,
           c.fecha_actualizacion,
           CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo
    FROM comentarios_videos c
    INNER JOIN usuarios u ON c.id_usuario = u.id
    WHERE c.id_video = ? AND c.esta_activo = 1
    ORDER BY c.fecha_creacion DESC
  `;

  const [rows] = await db.query(sql, [id_video]);
  return rows;
},


  buscarPorId: async (id) => {
    const sql = `SELECT * FROM comentarios_videos WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  actualizar: async (id, comentario) => {
    const sql = `
      UPDATE comentarios_videos
      SET texto_comentario = ?,
          marca_tiempo_segundos = ?,
          fecha_actualizacion = NOW()
      WHERE id = ?
    `;

    const values = [
      comentario.texto_comentario,
      comentario.marca_tiempo_segundos || null,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    console.log(`🗑️ Modelo: Desactivando comentario ID: ${id}`);
    
    const sql = `
      UPDATE comentarios_videos
      SET esta_activo = 0, fecha_actualizacion = NOW()
      WHERE id = ?
    `;
    
    try {
      const [result] = await db.query(sql, [id]);
      console.log(`✅ Modelo: Comentario desactivado. Affected rows: ${result.affectedRows}`);
      return result;
    } catch (error) {
      console.error('❌ Modelo: Error al desactivar comentario:', error);
      throw error;
    }
  }
};

module.exports = ComentarioModel;
