const db = require('../config/db');

const CertificadoModel = {
  crear: async (certificado) => {
    const sql = `
      INSERT INTO certificados (
        id_usuario,
        id_curso,
        codigo_certificado,
        fecha_emision,
        fecha_vencimiento,
        url_pdf,
        es_valido
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?)
    `;

    const values = [
      certificado.id_usuario,
      certificado.id_curso,
      certificado.codigo_certificado,
      certificado.fecha_vencimiento || null,
      certificado.url_pdf || null,
      certificado.es_valido !== undefined ? certificado.es_valido : 1
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  listar: async () => {
    const query = 'SELECT * FROM certificados ORDER BY fecha_emision DESC';
    const [rows] = await db.query(query);
    return rows;
  },

  buscarPorId: async (id) => {
    const sql = `SELECT * FROM certificados WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  buscarPorCodigo: async (codigo) => {
    const sql = `SELECT * FROM certificados WHERE codigo_certificado = ?`;
    const [rows] = await db.query(sql, [codigo]);
    return rows.length > 0 ? rows[0] : null;
  },

  buscarPorUsuarioYCurso: async (idUsuario, idCurso) => {
    const sql = `
      SELECT *
      FROM certificados
      WHERE id_usuario = ? AND id_curso = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [idUsuario, idCurso]);
    return rows.length > 0 ? rows[0] : null;
  },

  actualizar: async (id, certificado) => {
    const sql = `
      UPDATE certificados
      SET id_usuario = ?, id_curso = ?, codigo_certificado = ?, 
          fecha_vencimiento = ?, url_pdf = ?, es_valido = ?
      WHERE id = ?
    `;

    const values = [
      certificado.id_usuario,
      certificado.id_curso,
      certificado.codigo_certificado,
      certificado.fecha_vencimiento || null,
      certificado.url_pdf || null,
      certificado.es_valido !== undefined ? certificado.es_valido : 1,
      id
    ];

    const [result] = await db.query(sql, values);
    return result;
  },

  eliminar: async (id) => {
    console.log(`🗑️ Modelo: Eliminando certificado ID: ${id}`);
    
    const sql = `DELETE FROM certificados WHERE id = ?`;
    
    try {
      const [result] = await db.query(sql, [id]);
      console.log(`✅ Modelo: DELETE ejecutado. Affected rows: ${result.affectedRows}`);
      return result;
    } catch (error) {
      console.error('❌ Modelo: Error en DELETE:', error);
      throw error;
    }
  },

  validarPorCodigo: async (codigo) => {
    const sql = `
      SELECT * 
      FROM certificados 
      WHERE codigo_certificado = ? AND es_valido = 1 
        AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= NOW())
    `;
    const [rows] = await db.query(sql, [codigo]);
    return rows.length > 0 ? rows[0] : null;
  },

  buscarPorUsuario: async (idUsuario) => {
    const sql = `
      SELECT c.*, u.nombre AS nombre_usuario, u.apellido AS apellido_usuario, cu.titulo AS titulo_curso
      FROM certificados c
      INNER JOIN usuarios u ON c.id_usuario = u.id
      INNER JOIN cursos cu ON c.id_curso = cu.id
      WHERE c.id_usuario = ?
      ORDER BY c.fecha_emision DESC
    `;
    const [rows] = await db.query(sql, [idUsuario]);
    return rows;
  }
};

module.exports = CertificadoModel;
