const db = require('../config/db');

class ProgresoModel {
  
  static async calcularEstadisticasProgreso(progreso) {
    return {
      total_interacciones: progreso.length,
      completadas: progreso.filter(p => p.completada).length,
      correctas: progreso.filter(p => p.es_correcta === true).length,
      puntos_totales: progreso.reduce((sum, p) => sum + p.puntos_obtenidos, 0),
      puntos_maximos: progreso.reduce((sum, p) => sum + p.puntos_maximos, 0),
      porcentaje_completado: progreso.length > 0 ?
        ((progreso.filter(p => p.completada).length / progreso.length) * 100).toFixed(2) : 0
    };
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
    
    const [interacciones] = await db.execute(query, [
      idUsuario, idUsuario, idVideo, tiempoActual
    ]);

    const interaccionPendiente = interacciones.find(
      interaccion => !interaccion.es_correcta
    );

    return {
      puede_continuar: !interaccionPendiente,
      tiempo_retroceso: interaccionPendiente ? interaccionPendiente.tiempo_activacion_segundos : null,
      interaccion_pendiente: interaccionPendiente ? {
        id: interaccionPendiente.id,
        titulo: interaccionPendiente.titulo,
        tiempo: interaccionPendiente.tiempo_activacion_segundos
      } : null,
      total_obligatorias: interacciones.length,
      completadas_correctamente: interacciones.filter(i => i.es_correcta).length
    };
  }

  static async obtenerEstadisticasInteraccion(idInteraccion) {
    const query = `
      SELECT 
        COUNT(*) as total_respuestas,
        SUM(CASE WHEN es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas,
        AVG(tiempo_respuesta_segundos) as tiempo_promedio,
        AVG(numero_intento) as intentos_promedio,
        MAX(numero_intento) as max_intentos
      FROM respuestas_interaccion 
      WHERE id_contenido_interactivo = ?
    `;
    
    const [estadisticas] = await db.execute(query, [idInteraccion]);
    return estadisticas[0];
  }

  static determinarDebeRetroceder(interaccion, evaluacion) {
    return interaccion.es_obligatorio && !evaluacion.es_correcta;
  }

  static calcularPuntosObtenidos(evaluacion, interaccion) {
    return evaluacion.es_correcta ? interaccion.puntos : 0;
  }
}

module.exports = ProgresoModel;
