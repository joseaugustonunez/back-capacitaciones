const db = require('../config/db');

class RespuestaInteraccion {

  static async crear(datos) {
    const {
      id_usuario,
      id_contenido_interactivo,
      datos_respuesta,
      es_correcta = false,
      puntos_obtenidos = 0,
      numero_intento = 1,
      tiempo_respuesta_segundos = 0
    } = datos;

    const query = `
      INSERT INTO respuestas_interaccion (
        id_usuario, id_contenido_interactivo, datos_respuesta,
        es_correcta, puntos_obtenidos, numero_intento, tiempo_respuesta_segundos
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id_usuario,
      id_contenido_interactivo,
      JSON.stringify(datos_respuesta),
      es_correcta ? 1 : 0,
      puntos_obtenidos,
      numero_intento,
      tiempo_respuesta_segundos
    ];

    const [result] = await db.execute(query, params);
    return result.insertId;
  }

  static async obtenerUltimoIntento(idUsuario, idContenido) {
    const query = `
      SELECT * FROM respuestas_interaccion 
      WHERE id_usuario = ? AND id_contenido_interactivo = ?
      ORDER BY numero_intento DESC 
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [idUsuario, idContenido]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      datos_respuesta: this._parseDatosRespuesta(row.datos_respuesta),
      es_correcta: Boolean(row.es_correcta)
    };
  }


  static async obtenerProgresoPorVideo(idUsuario, idVideo) {
    const query = `
    SELECT ci.id, ci.tiempo_activacion_segundos, ci.es_obligatorio, 
           ci.puntos, ci.titulo, ci.id_tipo_interaccion,
           ri.es_correcta, ri.puntos_obtenidos, ri.numero_intento, 
           ri.fecha_envio
    FROM contenido_interactivo ci
    LEFT JOIN respuestas_interaccion ri ON ci.id = ri.id_contenido_interactivo
      AND ri.id_usuario = ?
      AND ri.numero_intento = (
        SELECT MAX(numero_intento) 
        FROM respuestas_interaccion
        WHERE id_contenido_interactivo = ci.id AND id_usuario = ?
      )
    WHERE ci.id_video = ? AND ci.esta_activo = 1
    ORDER BY ci.tiempo_activacion_segundos ASC
  `;

    const [rows] = await db.execute(query, [idUsuario, idUsuario, idVideo]);

    return rows.map(row => ({
      id_interaccion: row.id,
      titulo: row.titulo,
      tiempo_activacion: row.tiempo_activacion_segundos,
      id_tipo_interaccion: row.id_tipo_interaccion,
      es_obligatorio: Boolean(row.es_obligatorio),
      puntos_maximos: row.puntos,
      completada: row.es_correcta !== null,
      es_correcta: row.es_correcta !== null ? Boolean(row.es_correcta) : null,
      puntos_obtenidos: row.puntos_obtenidos || 0,
      numero_intentos: row.numero_intento || 0,
      fecha_completado: row.fecha_envio
    }));
  }



  static async verificarInteraccionesObligatorias(idUsuario, idVideo, tiempoActual) {
    const query = `
      SELECT ci.id, ci.tiempo_activacion_segundos, ci.titulo,
             ri.es_correcta, ri.numero_intento
      FROM contenido_interactivo ci
      LEFT JOIN respuestas_interaccion ri ON ci.id = ri.id_contenido_interactivo
        AND ri.id_usuario = ?
        AND ri.numero_intento = (
          SELECT MAX(numero_intento) 
          FROM respuestas_interaccion
          WHERE id_contenido_interactivo = ci.id AND id_usuario = ?
        )
      WHERE ci.id_video = ?
        AND ci.es_obligatorio = 1
        AND ci.esta_activo = 1
        AND ci.tiempo_activacion_segundos <= ?
      ORDER BY ci.tiempo_activacion_segundos ASC
    `;

    const [rows] = await db.execute(query, [idUsuario, idUsuario, idVideo, tiempoActual]);

    const interaccionPendiente = rows.find(interaccion => !interaccion.es_correcta);

    return {
      puede_continuar: !interaccionPendiente,
      tiempo_retroceso: interaccionPendiente ? interaccionPendiente.tiempo_activacion_segundos : null,
      interaccion_pendiente: interaccionPendiente ? {
        id: interaccionPendiente.id,
        titulo: interaccionPendiente.titulo,
        tiempo: interaccionPendiente.tiempo_activacion_segundos
      } : null,
      total_obligatorias: rows.length,
      completadas_correctamente: rows.filter(i => i.es_correcta).length
    };
  }


  static async obtenerTodasRespuestas(idUsuario, idContenido) {
    const query = `
      SELECT ri.*, ci.titulo as interaccion_titulo, ci.puntos as puntos_maximos
      FROM respuestas_interaccion ri
      INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
      WHERE ri.id_usuario = ? AND ri.id_contenido_interactivo = ?
      ORDER BY ri.numero_intento ASC
    `;

    const [rows] = await db.execute(query, [idUsuario, idContenido]);

    return rows.map(row => ({
      ...row,
      datos_respuesta: this._parseDatosRespuesta(row.datos_respuesta),
      es_correcta: Boolean(row.es_correcta)
    }));
  }


  static async obtenerEstadisticasUsuario(idUsuario, idVideo = null) {
    let query = `
      SELECT 
        COUNT(ri.id) as total_respuestas,
        SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas,
        SUM(ri.puntos_obtenidos) as puntos_totales,
        AVG(ri.tiempo_respuesta_segundos) as tiempo_promedio,
        AVG(ri.numero_intento) as intentos_promedio,
        COUNT(DISTINCT ri.id_contenido_interactivo) as interacciones_completadas
      FROM respuestas_interaccion ri
      INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
      WHERE ri.id_usuario = ?
    `;

    const params = [idUsuario];

    if (idVideo) {
      query += ' AND ci.id_video = ?';
      params.push(idVideo);
    }

    const [rows] = await db.execute(query, params);
    const stats = rows[0];

    return {
      total_respuestas: stats.total_respuestas || 0,
      respuestas_correctas: stats.respuestas_correctas || 0,
      porcentaje_acierto: stats.total_respuestas > 0 ?
        ((stats.respuestas_correctas / stats.total_respuestas) * 100).toFixed(2) : 0,
      puntos_totales: stats.puntos_totales || 0,
      tiempo_promedio: parseFloat(stats.tiempo_promedio) || 0,
      intentos_promedio: parseFloat(stats.intentos_promedio) || 0,
      interacciones_completadas: stats.interacciones_completadas || 0
    };
  }


  static async reiniciarProgreso(idUsuario, idVideo) {
    const query = `
      DELETE ri FROM respuestas_interaccion ri
      INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
      WHERE ri.id_usuario = ? AND ci.id_video = ?
    `;

    const [result] = await db.execute(query, [idUsuario, idVideo]);
    return result.affectedRows > 0;
  }


  static async obtenerRankingPorVideo(idVideo, limite = 10) {
    const query = `
      SELECT 
        ri.id_usuario,
        u.nombre_usuario,
        u.email,
        SUM(ri.puntos_obtenidos) as puntos_totales,
        COUNT(ri.id) as total_respuestas,
        SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas,
        ROUND((SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) / COUNT(ri.id)) * 100, 2) as porcentaje_aciertos
      FROM respuestas_interaccion ri
      INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
      LEFT JOIN usuarios u ON ri.id_usuario = u.id
      WHERE ci.id_video = ?
      GROUP BY ri.id_usuario
      ORDER BY puntos_totales DESC, porcentaje_aciertos DESC
      LIMIT ?
    `;

    const [rows] = await db.execute(query, [idVideo, limite]);
    return rows;
  }

  static _parseDatosRespuesta(datosRespuesta) {
    if (typeof datosRespuesta === 'string') {
      try {
        return JSON.parse(datosRespuesta);
      } catch (e) {
        console.warn('Error al parsear datos de respuesta:', e);
        return {};
      }
    }
    return datosRespuesta || {};
  }
}

module.exports = RespuestaInteraccion;