const db = require('../config/db');

/**
 * Construye filtros dinámicos reutilizables
 */
function construirFiltros({ dni, nombre, curso, mes, fecha_inicio, fecha_fin, estado }) {
  let condiciones = [];
  let valores = [];

  if (dni) {
    condiciones.push("u.dni = ?");
    valores.push(dni);
  }

  if (nombre) {
    condiciones.push("CONCAT(u.nombre, ' ', u.apellido) LIKE ?");
    valores.push(`%${nombre}%`);
  }

  if (curso) {
    condiciones.push("c.titulo LIKE ?");
    valores.push(`%${curso}%`);
  }

  if (mes) {
    condiciones.push("DATE_FORMAT(ic.fecha_inscripcion, '%Y-%m') = ?");
    valores.push(mes);
  }

  if (fecha_inicio && fecha_fin) {
    condiciones.push("ic.fecha_inscripcion BETWEEN ? AND ?");
    valores.push(fecha_inicio, fecha_fin);
  }

  if (estado === "completo") {
    condiciones.push("cert.es_valido = 1");
  } else if (estado === "incompleto") {
    condiciones.push("(cert.id IS NULL OR cert.es_valido = 0)");
  }

  // Siempre mostrar solo estudiantes
  condiciones.push("u.rol = 'estudiante'");

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  return { where, valores };
}

const EstadisticasModel = {

  obtenerTotales: async () => {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM cursos) AS total_cursos,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante') AS total_estudiantes,
        (SELECT COUNT(*) FROM certificados WHERE es_valido = 1) AS total_certificados,
        ROUND(
          (SELECT COUNT(*) FROM certificados WHERE es_valido = 1) * 100.0 /
          NULLIF((SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante'), 0)
        , 2) AS tasa_finalizacion
    `);
    return rows[0];
  },

  obtenerInscritosPorCurso: async ({ curso } = {}) => {
    let where = "";
    let valores = [];

    if (curso) {
      where = "WHERE c.titulo LIKE ?";
      valores.push(`%${curso}%`);
    }

    const sql = `
      SELECT 
        c.id AS id_curso,
        c.titulo AS nombre_curso,
        COUNT(ic.id_usuario) AS total_inscritos
      FROM cursos c
      LEFT JOIN inscripciones_cursos ic ON c.id = ic.id_curso
      ${where}
      GROUP BY c.id, c.titulo
      ORDER BY total_inscritos DESC
    `;

    const [rows] = await db.query(sql, valores);
    return rows;
  },

  matriculasCertificadosPorMes: async ({ mes } = {}) => {
    let where = "";
    let valores = [];

    if (mes) {
      where = "WHERE DATE_FORMAT(ic.fecha_inscripcion, '%Y-%m') = ?";
      valores.push(mes);
    }

    const query = `
      SELECT 
        DATE_FORMAT(ic.fecha_inscripcion, '%Y-%m') AS month,
        COUNT(DISTINCT ic.id_usuario) AS alumnos,
        COUNT(DISTINCT CASE WHEN c.es_valido = 1 THEN c.id END) AS certificados
      FROM inscripciones_cursos ic
      LEFT JOIN certificados c
        ON ic.id_usuario = c.id_usuario AND ic.id_curso = c.id_curso
      ${where}
      GROUP BY DATE_FORMAT(ic.fecha_inscripcion, '%Y-%m')
      ORDER BY month;
    `;

    const [rows] = await db.execute(query, valores);
    return rows;
  },

  obtenerProgresoUsuarios: async (filtros = {}) => {
    const { where, valores } = construirFiltros(filtros);

    const sql = `
      SELECT 
        CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
        u.dni,
        c.titulo AS nombre_curso,
        SUM(v.duracion_segundos) AS duracion_total,
        SUM(LEAST(IFNULL(pv.segundos_vistos, 0), v.duracion_segundos)) AS segundos_vistos,
        ROUND(
            (SUM(LEAST(IFNULL(pv.segundos_vistos, 0), v.duracion_segundos)) / SUM(v.duracion_segundos)) * 100,
            2
        ) AS porcentaje_avance
      FROM inscripciones_cursos ic
      JOIN usuarios u ON ic.id_usuario = u.id
      JOIN cursos c ON ic.id_curso = c.id
      JOIN modulos_curso mc ON mc.id_curso = c.id
      JOIN videos v ON v.id_modulo = mc.id
      LEFT JOIN progreso_videos pv ON v.id = pv.id_video AND pv.id_usuario = ic.id_usuario
      ${where}
      GROUP BY u.id, c.id
      ORDER BY porcentaje_avance DESC, nombre_completo, nombre_curso;
    `;

    const [rows] = await db.query(sql, valores);
    return rows;
  },

  procesosCusos: async (filtros = {}) => {
    const { where, valores } = construirFiltros(filtros);

    const sql = `
      SELECT 
        c.titulo AS curso,
        COUNT(DISTINCT ic.id_usuario) AS total_alumnos,
        COUNT(DISTINCT CASE WHEN cert.es_valido = 1 THEN cert.id END) AS completaron,
        COUNT(DISTINCT CASE WHEN cert.id IS NULL OR cert.es_valido = 0 THEN ic.id_usuario END) AS no_completaron
      FROM inscripciones_cursos ic
      LEFT JOIN certificados cert ON ic.id_usuario = cert.id_usuario AND ic.id_curso = cert.id_curso
      JOIN cursos c ON ic.id_curso = c.id
      JOIN usuarios u ON ic.id_usuario = u.id
      ${where}
      GROUP BY c.id, c.titulo
      ORDER BY c.titulo;
    `;

    const [rows] = await db.query(sql, valores);
    return rows;
  }

};

module.exports = EstadisticasModel;
