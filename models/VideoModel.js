const db = require('../config/db');

const VideoModel = {
  
  crear: async (video) => {
    const sql = `
      INSERT INTO videos (
        id_modulo,
        titulo,
        descripcion,
        url_video,
        url_miniatura,
        duracion_segundos,
        indice_orden,
        es_vista_previa,
        transcripcion,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      video.id_modulo,
      video.titulo,
      video.descripcion || null,
      video.url_video,
      video.url_miniatura || null,
      video.duracion_segundos || 0,
      video.indice_orden,
      video.es_vista_previa !== undefined ? Number(video.es_vista_previa) : 0,
      video.transcripcion || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = `
      SELECT 
        v.id, 
        v.id_modulo, 
        v.titulo, 
        v.descripcion, 
        v.url_video,
        v.url_miniatura,
        v.duracion_segundos,
        v.indice_orden, 
        v.es_vista_previa,
        v.transcripcion,
        v.fecha_creacion, 
        v.fecha_actualizacion,
        m.titulo as nombre_modulo,
        c.titulo as nombre_curso
      FROM videos v
      LEFT JOIN modulos_curso m ON v.id_modulo = m.id
      LEFT JOIN cursos c ON m.id_curso = c.id
      ORDER BY v.id_modulo, v.indice_orden ASC
    `;

    const [rows] = await db.query(query);
    return rows;
  },

  listarPorModulo: async (idModulo, incluirVistasPrevia = true) => {
    let query = `
      SELECT 
        id, 
        id_modulo, 
        titulo, 
        descripcion, 
        url_video,
        url_miniatura,
        duracion_segundos,
        indice_orden, 
        es_vista_previa,
        transcripcion,
        fecha_creacion, 
        fecha_actualizacion
      FROM videos 
      WHERE id_modulo = ?
    `;

    const values = [idModulo];

    if (!incluirVistasPrevia) {
      query += ' AND es_vista_previa = 0';
    }

    query += ' ORDER BY indice_orden ASC';

    const [rows] = await db.query(query, values);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `
      SELECT 
        v.id, 
        v.id_modulo, 
        v.titulo, 
        v.descripcion, 
        v.url_video,
        v.url_miniatura,
        v.duracion_segundos,
        v.indice_orden, 
        v.es_vista_previa,
        v.transcripcion,
        v.fecha_creacion, 
        v.fecha_actualizacion,
        m.titulo as nombre_modulo,
        c.titulo as nombre_curso
      FROM videos v
      LEFT JOIN modulos_curso m ON v.id_modulo = m.id
      LEFT JOIN cursos c ON m.id_curso = c.id
      WHERE v.id = ?
    `;

    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

 actualizar: async (id, video) => {
  const campos = [];
  const values = [];

  if (video.id_modulo !== undefined) {
    campos.push("id_modulo = ?");
    values.push(video.id_modulo);
  }

  if (video.titulo !== undefined) {
    campos.push("titulo = ?");
    values.push(video.titulo);
  }

  if (video.descripcion !== undefined) {
    campos.push("descripcion = ?");
    values.push(video.descripcion || null);
  }

  if (video.url_video !== undefined) {
    campos.push("url_video = ?");
    values.push(video.url_video);
  }

  if (video.url_miniatura !== undefined) {
    campos.push("url_miniatura = ?");
    values.push(video.url_miniatura || null);
  }

  if (video.duracion_segundos !== undefined) {
    campos.push("duracion_segundos = ?");
    values.push(video.duracion_segundos || 0);
  }

  if (video.indice_orden !== undefined) {
    campos.push("indice_orden = ?");
    values.push(video.indice_orden);
  }

  if (video.es_vista_previa !== undefined) {
    campos.push("es_vista_previa = ?");
    values.push(video.es_vista_previa);
  }

  if (video.transcripcion !== undefined) {
    campos.push("transcripcion = ?");
    values.push(video.transcripcion || null);
  }

  campos.push("fecha_actualizacion = NOW()");

  const sql = `
    UPDATE videos
    SET ${campos.join(", ")}
    WHERE id = ?
  `;

  values.push(id);

  const [result] = await db.query(sql, values);
  return result;
},

  eliminar: async (id) => {

    const sql = `DELETE FROM videos WHERE id = ?`;

    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  verificarModulo: async (idModulo) => {
    const sql = `SELECT COUNT(*) as count FROM modulos_curso WHERE id = ?`;
    const [rows] = await db.query(sql, [idModulo]);
    return rows[0].count > 0;
  },

  obtenerSiguienteOrden: async (idModulo) => {
    const sql = `
      SELECT COALESCE(MAX(indice_orden), 0) + 1 as siguiente_orden 
      FROM videos 
      WHERE id_modulo = ?
    `;

    const [rows] = await db.query(sql, [idModulo]);
    return rows[0].siguiente_orden;
  },

  reordenar: async (videosOrden) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      for (const video of videosOrden) {
        const sql = `
          UPDATE videos 
          SET indice_orden = ?, fecha_actualizacion = NOW()
          WHERE id = ?
        `;
        await connection.query(sql, [video.orden, video.id]);
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  contarPorModulo: async (idModulo, soloNoVistasPrevia = false) => {
    let query = `SELECT COUNT(*) as count FROM videos WHERE id_modulo = ?`;
    const values = [idModulo];

    if (soloNoVistasPrevia) {
      query += ' AND es_vista_previa = 0';
    }

    const [rows] = await db.query(query, values);
    return rows[0].count;
  },

  existeTituloEnModulo: async (titulo, idModulo, idExcluir = null) => {
    let query = `
      SELECT COUNT(*) as count 
      FROM videos 
      WHERE titulo = ? AND id_modulo = ?
    `;
    let values = [titulo, idModulo];

    if (idExcluir) {
      query += ' AND id != ?';
      values.push(idExcluir);
    }

    const [rows] = await db.query(query, values);
    return rows[0].count > 0;
  },

  cambiarVistaPrevia: async (id, esVistaPrevia) => {
    const sql = `UPDATE videos SET es_vista_previa = ?, fecha_actualizacion = NOW() WHERE id = ?`;
    const [result] = await db.query(sql, [esVistaPrevia, id]);
    return result;
  },

  listarVistasPrevia: async () => {
    const query = `
      SELECT 
        v.id, 
        v.id_modulo, 
        v.titulo, 
        v.descripcion, 
        v.url_video,
        v.url_miniatura,
        v.duracion_segundos,
        v.indice_orden,
        v.fecha_creacion,
        m.titulo as nombre_modulo,
        c.titulo as nombre_curso
      FROM videos v
      INNER JOIN modulos_curso m ON v.id_modulo = m.id
      INNER JOIN cursos c ON m.id_curso = c.id
      WHERE v.es_vista_previa = 1
      ORDER BY c.titulo, m.titulo, v.indice_orden ASC
    `;

    const [rows] = await db.query(query);
    return rows;
  },

  duplicar: async (id, nuevoTitulo = null) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [original] = await connection.query(
        'SELECT * FROM videos WHERE id = ?',
        [id]
      );

      if (original.length === 0) {
        throw new Error('Video no encontrado');
      }

      const video = original[0];

      const [ordenResult] = await connection.query(
        'SELECT COALESCE(MAX(indice_orden), 0) + 1 as siguiente_orden FROM videos WHERE id_modulo = ?',
        [video.id_modulo]
      );

      const nuevoOrden = ordenResult[0].siguiente_orden;
      const titulo = nuevoTitulo || `${video.titulo} - Copia`;

      const [result] = await connection.query(`
        INSERT INTO videos (
          id_modulo, titulo, descripcion, url_video, url_miniatura, 
          duracion_segundos, indice_orden, es_vista_previa, transcripcion, fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        video.id_modulo,
        titulo,
        video.descripcion,
        video.url_video,
        video.url_miniatura,
        video.duracion_segundos,
        nuevoOrden,
        video.es_vista_previa,
        video.transcripcion
      ]);

      await connection.commit();
      return { insertId: result.insertId, nuevoOrden };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  buscar: async (textoBusqueda, idModulo = null, limite = 50) => {
    let query = `
      SELECT 
        v.id, 
        v.id_modulo, 
        v.titulo, 
        v.descripcion, 
        v.url_video,
        v.url_miniatura,
        v.duracion_segundos,
        v.indice_orden, 
        v.es_vista_previa,
        v.fecha_creacion,
        m.titulo as nombre_modulo,
        c.titulo as nombre_curso
      FROM videos v
      LEFT JOIN modulos_curso m ON v.id_modulo = m.id
      LEFT JOIN cursos c ON m.id_curso = c.id
      WHERE (
        v.titulo LIKE ? OR 
        v.descripcion LIKE ? OR 
        v.transcripcion LIKE ?
      )
    `;

    const searchTerm = `%${textoBusqueda}%`;
    let values = [searchTerm, searchTerm, searchTerm];

    if (idModulo) {
      query += ' AND v.id_modulo = ?';
      values.push(idModulo);
    }

    query += ' ORDER BY v.titulo ASC LIMIT ?';
    values.push(limite);

    const [rows] = await db.query(query, values);
    return rows;
  },

  obtenerDuracionTotalPorModulo: async (idModulo) => {
    const sql = `
      SELECT 
        COALESCE(SUM(duracion_segundos), 0) as duracion_total_segundos,
        COUNT(*) as total_videos
      FROM videos 
      WHERE id_modulo = ?
    `;

    const [rows] = await db.query(sql, [idModulo]);
    return rows[0];
  },

  obtenerEstadisticas: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_videos,
        SUM(duracion_segundos) as duracion_total_segundos,
        AVG(duracion_segundos) as duracion_promedio_segundos,
        COUNT(CASE WHEN es_vista_previa = 1 THEN 1 END) as total_vistas_previa,
        COUNT(DISTINCT id_modulo) as total_modulos_con_videos
      FROM videos
    `;

    const [rows] = await db.query(sql);
    return rows[0];
  },

  actualizarTranscripcion: async (id, transcripcion) => {
    const sql = `
      UPDATE videos 
      SET transcripcion = ?, fecha_actualizacion = NOW() 
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [transcripcion, id]);
    return result;
  },

  eliminarPorModulo: async (idModulo) => {
    const sql = `DELETE FROM videos WHERE id_modulo = ?`;

    try {
      const [result] = await db.query(sql, [idModulo]);
      return result;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = VideoModel;