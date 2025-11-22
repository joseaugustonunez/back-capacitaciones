const db = require("../config/db");

const CursoModel = {
  getAvanceCursosByUsuario: async (idUsuario) => {
    const [rows] = await db.query(
      `
      SELECT 
          ic.id_usuario,
          ic.id_curso,
          c.titulo AS curso,
          SUM(v.duracion_segundos) AS duracion_total,
          SUM(LEAST(IFNULL(pv.segundos_vistos,0), v.duracion_segundos)) AS segundos_vistos,
          ROUND(
              (SUM(LEAST(IFNULL(pv.segundos_vistos,0), v.duracion_segundos)) / SUM(v.duracion_segundos)) * 100,
              2
          ) AS porcentaje_avance
      FROM inscripciones_cursos ic
      JOIN cursos c ON ic.id_curso = c.id
      JOIN modulos_curso mc ON mc.id_curso = c.id
      JOIN videos v ON v.id_modulo = mc.id
      LEFT JOIN progreso_videos pv 
          ON v.id = pv.id_video 
          AND pv.id_usuario = ic.id_usuario
      WHERE ic.id_usuario = ?
      GROUP BY ic.id_usuario, ic.id_curso
      `,
      [idUsuario]
    );

    return rows;
  },
  crear: async (curso) => {
    const sql = `
      INSERT INTO cursos (
        titulo,
        descripcion,
        descripcion_corta,
        id_instructor,
        id_categoria,
        url_miniatura,
        duracion_horas,
        nivel_dificultad,
        estado,
        fecha_creacion,
        fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      curso.titulo,
      curso.descripcion || null,
      curso.descripcion_corta || null,
      curso.id_instructor,
      curso.id_categoria,
      curso.url_miniatura || null,
      curso.duracion_horas || 0,
      curso.nivel_dificultad || "principiante",
      curso.estado || "borrador",
    ];

    try {
      const [result] = await db.query(sql, values);
      return result;
    } catch (error) {
      throw error;
    }
  },

  listar: async (filtros = {}) => {
    let sql = `
    SELECT 
    c.*,
    cat.nombre AS categoria_nombre,
    CONCAT('Instructor ', c.id_instructor) AS instructor_nombre,
    COUNT(m.id) AS total_modulos
FROM cursos c
LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
LEFT JOIN modulos_curso m ON c.id = m.id_curso AND m.esta_activo = 1
GROUP BY c.id, cat.nombre
  `;

    const conditions = [];
    const values = [];

    if (filtros.id_categoria) {
      conditions.push("c.id_categoria = ?");
      values.push(filtros.id_categoria);
    }

    if (filtros.titulo) {
      conditions.push("c.titulo LIKE ?");
      values.push(`%${filtros.titulo}%`);
    }

    if (conditions.length > 0) {
      sql += " AND " + conditions.join(" AND ");
    }

    sql += " ORDER BY c.fecha_creacion DESC";

    try {
      const [rows] = await db.query(sql, values);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  listarPublicados: async (filtros = {}) => {
    let sql = `
    SELECT 
      c.*,
      cat.nombre AS categoria_nombre,
      CONCAT('Instructor ', c.id_instructor) AS instructor_nombre,
      COUNT(m.id) AS total_modulos
    FROM cursos c
    LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
    LEFT JOIN modulos_curso m ON c.id = m.id_curso AND m.esta_activo = 1
    WHERE c.estado = 'publicado'
  `;

    const values = [];

    if (filtros.id_categoria) {
      sql += " AND c.id_categoria = ?";
      values.push(filtros.id_categoria);
    }

    if (filtros.busqueda) {
      sql += " AND (c.titulo LIKE ? OR c.descripcion LIKE ?)";
      const searchTerm = `%${filtros.busqueda}%`;
      values.push(searchTerm, searchTerm);
    }

    sql += `
    GROUP BY c.id, cat.nombre
    ORDER BY c.fecha_creacion DESC
  `;

    try {
      const [rows] = await db.query(sql, values);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  buscarPorId: async (id) => {
    const sql = `
      SELECT 
        c.*,
        cat.nombre as categoria_nombre,
        CONCAT('Instructor ', c.id_instructor) as instructor_nombre
      FROM cursos c
      LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
      WHERE c.id = ?
    `;

    try {
      const [rows] = await db.query(sql, [id]);
      const curso = rows.length > 0 ? rows[0] : null;

      return curso;
    } catch (error) {
      throw error;
    }
  },
 buscarConModulos: async (id) => {
  const sqlCurso = `
    SELECT 
      c.*,
      cat.nombre as categoria_nombre,
      CONCAT('Instructor ', c.id_instructor) as instructor_nombre
    FROM cursos c
    LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
    WHERE c.id = ?
  `;

  const sqlModulos = `
    SELECT 
      m.id,
      m.titulo,
      m.descripcion,
      m.indice_orden,
      m.esta_activo
    FROM modulos_curso m
    WHERE m.id_curso = ?
    ORDER BY m.indice_orden ASC
  `;

  try {
    const [cursoRows] = await db.query(sqlCurso, [id]);
    if (cursoRows.length === 0) return null;

    const curso = cursoRows[0];
    const [modulos] = await db.query(sqlModulos, [id]);

    curso.modulos = modulos;

    return curso;
  } catch (error) {
    throw error;
  }
},


  actualizar: async (id, curso) => {
    const campos = [];
    const values = [];

    if (curso.titulo !== undefined) {
      campos.push("titulo = ?");
      values.push(curso.titulo);
    }
    if (curso.descripcion !== undefined) {
      campos.push("descripcion = ?");
      values.push(curso.descripcion);
    }
    if (curso.descripcion_corta !== undefined) {
      campos.push("descripcion_corta = ?");
      values.push(curso.descripcion_corta);
    }
    if (curso.id_instructor !== undefined) {
      campos.push("id_instructor = ?");
      values.push(curso.id_instructor);
    }
    if (curso.id_categoria !== undefined) {
      campos.push("id_categoria = ?");
      values.push(curso.id_categoria);
    }
    if (curso.url_miniatura !== undefined) {
      campos.push("url_miniatura = ?");
      values.push(curso.url_miniatura);
    }
    if (curso.duracion_horas !== undefined) {
      campos.push("duracion_horas = ?");
      values.push(curso.duracion_horas);
    }
    if (curso.nivel_dificultad !== undefined) {
      campos.push("nivel_dificultad = ?");
      values.push(curso.nivel_dificultad);
    }
    if (curso.estado !== undefined) {
      campos.push("estado = ?");
      values.push(curso.estado);
    }

    campos.push("fecha_actualizacion = NOW()");

    const sql = `
    UPDATE cursos
    SET ${campos.join(", ")}
    WHERE id = ?
  `;
    values.push(id);

    try {
      const [result] = await db.query(sql, values);
      return result;
    } catch (error) {
      throw error;
    }
  },


  eliminar: async (id) => {

    const sql = `DELETE FROM cursos WHERE id = ?`;

    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  cambiarEstado: async (id, nuevoEstado) => {
    const sql = `
      UPDATE cursos 
      SET estado = ?, fecha_actualizacion = NOW() 
      WHERE id = ?
    `;

    try {
      const [result] = await db.query(sql, [nuevoEstado, id]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  buscarPorInstructor: async (idInstructor) => {
    const sql = `
      SELECT 
        c.*,
        cat.nombre as categoria_nombre
      FROM cursos c
      LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
      WHERE c.id_instructor = ?
      ORDER BY c.fecha_creacion DESC
    `;

    try {
      const [rows] = await db.query(sql, [idInstructor]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  buscarPorCategoria: async (idCategoria) => {
    const sql = `
      SELECT 
        c.*,
        cat.nombre as categoria_nombre
      FROM cursos c
      LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
      WHERE c.id_categoria = ?
      ORDER BY c.fecha_creacion DESC
    `;

    try {
      const [rows] = await db.query(sql, [idCategoria]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  obtenerEstadisticas: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_cursos,
        COUNT(CASE WHEN estado = 'publicado' THEN 1 END) as publicados,
        COUNT(CASE WHEN estado = 'borrador' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'archivado' THEN 1 END) as archivados,
        AVG(duracion_horas) as duracion_promedio,
        COUNT(CASE WHEN nivel_dificultad = 'principiante' THEN 1 END) as principiante,
        COUNT(CASE WHEN nivel_dificultad = 'intermedio' THEN 1 END) as intermedio,
        COUNT(CASE WHEN nivel_dificultad = 'avanzado' THEN 1 END) as avanzado
      FROM cursos
    `;

    try {
      const [rows] = await db.query(sql);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
};

module.exports = CursoModel;
