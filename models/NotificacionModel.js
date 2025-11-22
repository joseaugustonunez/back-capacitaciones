const db = require('../config/db');

const NotificacionModel = {
  crear: async (notificacion) => {
    const sql = `
      INSERT INTO notificaciones (
        id_usuario,
        titulo,
        mensaje,
        tipo,
        esta_leida,
        tipo_entidad_relacionada,
        id_entidad_relacionada,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, 0, ?, ?, NOW())
    `;

    const values = [
      notificacion.id_usuario,
      notificacion.titulo,
      notificacion.mensaje,
      notificacion.tipo || 'info',
      notificacion.tipo_entidad_relacionada || null,
      notificacion.id_entidad_relacionada || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listarPorUsuario: async (id_usuario) => {
    const sql = `
      SELECT * 
      FROM notificaciones
      WHERE id_usuario = ?
      ORDER BY fecha_creacion DESC
    `;
    const [rows] = await db.query(sql, [id_usuario]);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM notificaciones WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  marcarComoLeida: async (id) => {
    const sql = `
      UPDATE notificaciones
      SET esta_leida = 1
      WHERE id = ?
    `;
    const [result] = await db.query(sql, [id]);
    return result;
  },

  marcarTodasComoLeidas: async (id_usuario) => {
    const sql = `
      UPDATE notificaciones
      SET esta_leida = 1
      WHERE id_usuario = ?
    `;
    const [result] = await db.query(sql, [id_usuario]);
    return result;
  },

  eliminar: async (id) => {
    console.log(`🗑️ Modelo: Eliminando notificación ID: ${id}`);
    const sql = `DELETE FROM notificaciones WHERE id = ?`;

    try {
      const [result] = await db.query(sql, [id]);
      console.log(`✅ Modelo: DELETE ejecutado. Affected rows: ${result.affectedRows}`);
      return result;
    } catch (error) {
      console.error('❌ Modelo: Error al eliminar notificación:', error);
      throw error;
    }
  }
};

module.exports = NotificacionModel;
