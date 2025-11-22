const db = require('../config/db');

const InscripcionCursoModel = {

 listarCursosConInscripcionPorUsuario: async (id_usuario) => {
  const sql = `   
    SELECT 
        c.id,
        c.titulo,
        c.descripcion,
        c.descripcion_corta,
        c.id_instructor,
        CONCAT(i.nombre, ' ', i.apellido) AS instructor_nombre,  
        c.id_categoria,
        cat.nombre AS categoria_nombre,
        c.url_miniatura,
        c.duracion_horas,
        c.nivel_dificultad,
        c.estado,
        c.fecha_creacion,
        c.fecha_actualizacion,

        -- Subquery para contar inscritos
        (
          SELECT COUNT(*) 
          FROM inscripciones_cursos ic2 
          WHERE ic2.id_curso = c.id
        ) AS total_inscritos,

        -- Datos de inscripción del usuario actual
        ic.fecha_inscripcion,
        ic.fecha_completado,
        ic.porcentaje_progreso,
        ic.estado AS estado_inscripcion,
        ic.puntuacion_final,
        ic.url_certificado

    FROM cursos c
    INNER JOIN inscripciones_cursos ic 
        ON c.id = ic.id_curso
    INNER JOIN categorias_cursos cat
        ON c.id_categoria = cat.id
    INNER JOIN usuarios i      
        ON c.id_instructor = i.id
    WHERE ic.id_usuario = ?
    ORDER BY ic.fecha_inscripcion DESC;
  `;

  const [rows] = await db.query(sql, [id_usuario]);
  return rows;
},

  crear: async (datos) => {
    const sql = `
      INSERT INTO inscripciones_cursos (
        id_usuario,
        id_curso,
        fecha_inscripcion,
        fecha_completado,
        porcentaje_progreso,
        estado,
        puntuacion_final,
        url_certificado
      ) VALUES (?, ?, NOW(), NULL, 0, 'activo', NULL, NULL)
    `;

    const values = [datos.id_usuario, datos.id_curso];
    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = `
      SELECT * 
      FROM inscripciones_cursos
      ORDER BY fecha_inscripcion DESC
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM inscripciones_cursos WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  buscarPorUsuario: async (id_usuario) => {
    const sql = `SELECT * FROM inscripciones_cursos WHERE id_usuario = ? ORDER BY fecha_inscripcion DESC`;
    const [rows] = await db.query(sql, [id_usuario]);
    return rows;
  },

  actualizar: async (id, inscripcion) => {
    const sql = `
      UPDATE inscripciones_cursos
      SET id_usuario = ?,
          id_curso = ?,
          fecha_completado = ?,
          porcentaje_progreso = ?,
          estado = ?,
          puntuacion_final = ?,
          url_certificado = ?
      WHERE id = ?
    `;

    const values = [
      inscripcion.id_usuario,
      inscripcion.id_curso,
      inscripcion.fecha_completado || null,
      inscripcion.porcentaje_progreso || 0,
      inscripcion.estado || 'activo',
      inscripcion.puntuacion_final || null,
      inscripcion.url_certificado || null,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    const sql = `DELETE FROM inscripciones_cursos WHERE id = ?`;
    const [result] = await db.query(sql, [id]);
    return result;
  }
};

module.exports = InscripcionCursoModel;
