const db = require('../config/db');

const ModuloCursoModel = {
obtenerVideosPorModulo: async (idModulo) => {
  const query = `
    SELECT 
      v.id,
      v.titulo,
      v.descripcion,
      v.url_video,
      v.url_miniatura,
      v.duracion_segundos,
      v.indice_orden,
      v.es_vista_previa,
      v.transcripcion,
      v.fecha_creacion,
      v.fecha_actualizacion
    FROM videos v
    WHERE v.id_modulo = ?
    ORDER BY v.indice_orden ASC
  `;

  try {
    const [rows] = await db.query(query, [idModulo]);
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: "Error al obtener videos" };
  }
},
  obtenerAvancePorUsuario: async (idUsuario) => {
    try {
      const query = `
        SELECT 
            ic.id_usuario,
            c.id AS id_curso,
            c.titulo AS curso,
            mc.id AS id_modulo,
            mc.titulo AS modulo,
            SUM(v.duracion_segundos) AS duracion_total,
            SUM(
              LEAST(
                COALESCE(pv.segundos_vistos, 0), 
                v.duracion_segundos
              )
            ) AS segundos_vistos,
            ROUND(
              (SUM(
                LEAST(
                  COALESCE(pv.segundos_vistos,0), 
                  v.duracion_segundos
                )
              ) / SUM(v.duracion_segundos)) * 100,
              2
            ) AS porcentaje_avance
        FROM inscripciones_cursos ic
        JOIN cursos c ON ic.id_curso = c.id
        JOIN modulos_curso mc ON c.id = mc.id_curso
        JOIN videos v ON mc.id = v.id_modulo
        LEFT JOIN progreso_videos pv 
          ON v.id = pv.id_video 
          AND pv.id_usuario = ic.id_usuario
        WHERE ic.id_usuario = ?
        GROUP BY ic.id_usuario, c.id, mc.id
      `;
      const [rows] = await db.query(query, [idUsuario]);
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: "Error al obtener avance" };
    }
  },
  crear: async (modulo) => {
    const sql = `
      INSERT INTO modulos_curso (
        id_curso,
        titulo,
        descripcion,
        indice_orden,
        esta_activo,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      modulo.id_curso,
      modulo.titulo,
      modulo.descripcion || null,
      modulo.indice_orden,
      modulo.esta_activo !== undefined ? modulo.esta_activo : true
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = `
      SELECT 
        m.id, 
        m.id_curso, 
        m.titulo, 
        m.descripcion, 
        m.indice_orden, 
        m.esta_activo, 
        m.fecha_creacion, 
        m.fecha_actualizacion,
        c.titulo as nombre_curso
      FROM modulos_curso m
      LEFT JOIN cursos c ON m.id_curso = c.id
      ORDER BY m.id_curso, m.indice_orden ASC
    `;
    
    const [rows] = await db.query(query);
    return rows;
  },

listarPorCurso: async (idCurso, soloActivos = true) => {
  let query = `
    SELECT 
      -- Curso
      c.id AS curso_id,
      c.titulo AS curso_titulo,
      c.descripcion AS curso_descripcion,
      c.descripcion_corta,
      c.id_instructor,
      CONCAT(u.nombre, ' ', u.apellido) AS instructor_nombre_completo,
      u.nombre AS instructor_nombre,
      u.apellido AS instructor_apellido,
      u.url_avatar AS instructor_avatar,
      c.id_categoria,
      c.url_miniatura,
      c.duracion_horas,
      c.nivel_dificultad,
      c.estado,
      c.fecha_creacion AS curso_fecha_creacion,
      c.fecha_actualizacion AS curso_fecha_actualizacion,

      -- 👇 Subquery para contar inscritos
      (
        SELECT COUNT(*) 
        FROM inscripciones_cursos ic 
        WHERE ic.id_curso = c.id
      ) AS total_inscritos,

      -- Módulo
      m.id AS modulo_id, 
      m.titulo AS modulo_titulo, 
      m.descripcion AS modulo_descripcion, 
      m.indice_orden AS modulo_indice_orden, 
      m.esta_activo AS modulo_activo, 
      m.fecha_creacion AS modulo_fecha_creacion, 
      m.fecha_actualizacion AS modulo_fecha_actualizacion,

      -- Video
      v.id AS video_id,
      v.titulo AS video_titulo,
      v.descripcion AS video_descripcion,
      v.url_video,
      v.url_miniatura AS video_miniatura,
      v.duracion_segundos,
      v.indice_orden AS video_indice_orden,
      v.es_vista_previa,
      v.transcripcion,
      v.fecha_creacion AS video_fecha_creacion,
      v.fecha_actualizacion AS video_fecha_actualizacion

    FROM cursos c
    LEFT JOIN usuarios u ON c.id_instructor = u.id
    LEFT JOIN modulos_curso m ON c.id = m.id_curso
    LEFT JOIN videos v ON m.id = v.id_modulo
    WHERE c.id = ?
  `;

  if (soloActivos) {
    query += ' AND m.esta_activo = 1';
  }

  query += ' ORDER BY m.indice_orden ASC, v.indice_orden ASC';

  const [rows] = await db.query(query, [idCurso]);

  if (rows.length === 0) return null;

  const curso = {
    id: rows[0].curso_id,
    titulo: rows[0].curso_titulo,
    descripcion: rows[0].curso_descripcion,
    descripcion_corta: rows[0].descripcion_corta,
    id_instructor: rows[0].id_instructor,
    instructor_nombre_completo: rows[0].instructor_nombre_completo,
    instructor_nombre: rows[0].instructor_nombre,
    instructor_apellido: rows[0].instructor_apellido,
    instructor_avatar: rows[0].instructor_avatar,
    id_categoria: rows[0].id_categoria,
    url_miniatura: rows[0].url_miniatura,
    duracion_horas: rows[0].duracion_horas,
    nivel_dificultad: rows[0].nivel_dificultad,
    estado: rows[0].estado,
    fecha_creacion: rows[0].curso_fecha_creacion,
    fecha_actualizacion: rows[0].curso_fecha_actualizacion,
    total_inscritos: rows[0].total_inscritos,
    modulos: []
  };

  const modulosMap = new Map();

  rows.forEach(row => {
    if (!row.modulo_id) return;

    if (!modulosMap.has(row.modulo_id)) {
      modulosMap.set(row.modulo_id, {
        id: row.modulo_id,
        titulo: row.modulo_titulo,
        descripcion: row.modulo_descripcion,
        indice_orden: row.modulo_indice_orden,
        esta_activo: row.modulo_activo,
        fecha_creacion: row.modulo_fecha_creacion,
        fecha_actualizacion: row.modulo_fecha_actualizacion,
        videos: []
      });
    }

    if (row.video_id) {
      modulosMap.get(row.modulo_id).videos.push({
        id: row.video_id,
        titulo: row.video_titulo,
        descripcion: row.video_descripcion,
        url_video: row.url_video,
        url_miniatura: row.video_miniatura,
        duracion_segundos: row.duracion_segundos,
        indice_orden: row.video_indice_orden,
        es_vista_previa: row.es_vista_previa,
        transcripcion: row.transcripcion,
        fecha_creacion: row.video_fecha_creacion,
        fecha_actualizacion: row.video_fecha_actualizacion
      });
    }
  });

  curso.modulos = Array.from(modulosMap.values());

  return curso;
},



  buscarPorId: async (id) => {
    const sql = `
      SELECT 
        m.id, 
        m.id_curso, 
        m.titulo, 
        m.descripcion, 
        m.indice_orden, 
        m.esta_activo, 
        m.fecha_creacion, 
        m.fecha_actualizacion,
        c.titulo as nombre_curso
      FROM modulos_curso m
      LEFT JOIN cursos c ON m.id_curso = c.id
      WHERE m.id = ?
    `;
    
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  actualizar: async (id, modulo) => {
    const sql = `
      UPDATE modulos_curso
      SET 
        id_curso = ?, 
        titulo = ?, 
        descripcion = ?, 
        indice_orden = ?, 
        esta_activo = ?
      WHERE id = ?
    `;

    const values = [
      modulo.id_curso,
      modulo.titulo,
      modulo.descripcion || null,
      modulo.indice_orden,
      modulo.esta_activo !== undefined ? modulo.esta_activo : true,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    
    const sql = `UPDATE modulos_curso SET esta_activo = 0 WHERE id = ?`;
    
    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  eliminarFisico: async (id) => {
    
    const sql = `DELETE FROM modulos_curso WHERE id = ?`;
    
    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (error) {
      console.error('❌ Modelo: Error en DELETE:', error);
      throw error;
    }
  },

  verificarCurso: async (idCurso) => {
    const sql = `SELECT COUNT(*) as count FROM cursos WHERE id = ?`;
    const [rows] = await db.query(sql, [idCurso]);
    return rows[0].count > 0;
  },

  obtenerSiguienteOrden: async (idCurso) => {
    const sql = `
      SELECT COALESCE(MAX(indice_orden), 0) + 1 as siguiente_orden 
      FROM modulos_curso 
      WHERE id_curso = ?
    `;
    
    const [rows] = await db.query(sql, [idCurso]);
    return rows[0].siguiente_orden;
  },

  reordenar: async (modulosOrden) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const modulo of modulosOrden) {
        const sql = `
          UPDATE modulos_curso 
          SET indice_orden = ? 
          WHERE id = ?
        `;
        await connection.query(sql, [modulo.orden, modulo.id]);
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

  contarPorCurso: async (idCurso, soloActivos = true) => {
    let query = `SELECT COUNT(*) as count FROM modulos_curso WHERE id_curso = ?`;
    const values = [idCurso];
    
    if (soloActivos) {
      query += ' AND esta_activo = 1';
    }
    
    const [rows] = await db.query(query, values);
    return rows[0].count;
  },

  existeTituloEnCurso: async (titulo, idCurso, idExcluir = null) => {
    let query = `
      SELECT COUNT(*) as count 
      FROM modulos_curso 
      WHERE titulo = ? AND id_curso = ? AND esta_activo = 1
    `;
    let values = [titulo, idCurso];
    
    if (idExcluir) {
      query += ' AND id != ?';
      values.push(idExcluir);
    }
    
    const [rows] = await db.query(query, values);
    return rows[0].count > 0;
  },

  cambiarEstado: async (id, estado) => {
    const sql = `UPDATE modulos_curso SET esta_activo = ? WHERE id = ?`;
    const [result] = await db.query(sql, [estado, id]);
    return result;
  },

  listarActivosOrdenados: async () => {
    const query = `
      SELECT 
        m.id, 
        m.id_curso, 
        m.titulo, 
        m.descripcion, 
        m.indice_orden, 
        m.fecha_creacion,
        c.nombre as nombre_curso
      FROM modulos_curso m
      INNER JOIN cursos c ON m.id_curso = c.id
      WHERE m.esta_activo = 1
      ORDER BY c.nombre, m.indice_orden ASC
    `;
    
    const [rows] = await db.query(query);
    return rows;
  },

  duplicar: async (id, nuevoTitulo = null) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [original] = await connection.query(
        'SELECT * FROM modulos_curso WHERE id = ?', 
        [id]
      );
      
      if (original.length === 0) {
        throw new Error('Módulo no encontrado');
      }
      
      const modulo = original[0];
      
      const [ordenResult] = await connection.query(
        'SELECT COALESCE(MAX(indice_orden), 0) + 1 as siguiente_orden FROM modulos_curso WHERE id_curso = ?',
        [modulo.id_curso]
      );
      
      const nuevoOrden = ordenResult[0].siguiente_orden;
      const titulo = nuevoTitulo || `${modulo.titulo} - Copia`;
      
      const [result] = await connection.query(`
        INSERT INTO modulos_curso (
          id_curso, titulo, descripcion, indice_orden, esta_activo, fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        modulo.id_curso,
        titulo,
        modulo.descripcion,
        nuevoOrden,
        modulo.esta_activo
      ]);
      
      await connection.commit();
      return { insertId: result.insertId, nuevoOrden };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = ModuloCursoModel;