const db = require('../config/db');

const UsuarioModel = {
  crear: async (usuario) => {
    const sql = `
      INSERT INTO usuarios (
        dni,
        correo_electronico,
        hash_contrasena,
        nombre,
        apellido,
        rol,
        url_avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      usuario.dni,
      usuario.correo_electronico,
      usuario.hash_contrasena,
      usuario.nombre,
      usuario.apellido,
      usuario.rol || 'estudiante',
      usuario.url_avatar || null
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  // Buscar por correo
  buscarPorCorreo: async (correo) => {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE correo_electronico = ?`,
      [correo]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // 🆕 Buscar por DNI
  buscarPorDni: async (dni) => {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE dni = ?`,
      [dni]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Obtener instructores
  obtenerInstructores: async () => {
    const [rows] = await db.query(
      `SELECT * FROM usuarios WHERE rol = 'instructor'`
    );
    return rows;
  },

  // Buscar por ID
  buscarPorId: async (id) => {
    const [rows] = await db.query(
      "SELECT id, dni, nombre, apellido FROM usuarios WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Obtener hash de contraseña
  obtenerHashContrasena: async (id) => {
    const [rows] = await db.query(
      'SELECT id, hash_contrasena FROM usuarios WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Actualizar contraseña
  actualizarContrasena: async (id, hashNuevaContrasena) => {
    const [result] = await db.query(
      'UPDATE usuarios SET hash_contrasena = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [hashNuevaContrasena, id]
    );
    return result.affectedRows > 0; 
  },

  // Actualizar avatar
  actualizarAvatar: async (id, urlAvatar) => {
    const [result] = await db.query(
      'UPDATE usuarios SET url_avatar = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [urlAvatar, id]
    );
    return result.affectedRows > 0;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (id_usuario) => {
    const sql = `
      SELECT 
        u.id AS id_usuario,
        (SELECT COUNT(DISTINCT ic.id_curso) 
         FROM inscripciones_cursos ic 
         WHERE ic.id_usuario = u.id) AS cursos_inscritos,
        (SELECT ROUND(SUM(pv.segundos_vistos) / 3600, 2) 
         FROM progreso_videos pv 
         WHERE pv.id_usuario = u.id) AS horas_vistas,
        (SELECT COUNT(*) 
         FROM certificados c 
         WHERE c.id_usuario = u.id) AS certificados_obtenidos
      FROM usuarios u
      WHERE u.id = ?;
    `;

    const [rows] = await db.query(sql, [id_usuario]);
    return rows.length > 0 ? rows[0] : null;
  }
};

module.exports = UsuarioModel;
