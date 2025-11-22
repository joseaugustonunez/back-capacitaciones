const RespuestaInteraccionModel = require('../models/RespuestaInteraccionModel');
const ContenidoInteractivo = require('../models/ContenidoModel');
const OpcionInteraccionModel = require('../models/OpcionInteraccionModel');

const RespuestaInteraccionController = {
  obtenerPorContenido: async (req, res) => {
    try {
      const { id_contenido_interactivo } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const respuestas = await RespuestaInteraccionModel.obtenerPorContenido(
        id_contenido_interactivo, 
        { page: parseInt(page), limit: parseInt(limit) }
      );
      
      res.json({
        success: true,
        data: respuestas.data,
        pagination: respuestas.pagination
      });
    } catch (error) {
      console.error('Error obtaining responses:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener respuestas' 
      });
    }
  },

  obtenerPorUsuarioYContenido: async (req, res) => {
    try {
      const { id_usuario, id_contenido_interactivo } = req.params;
      
      const respuestas = await RespuestaInteraccionModel.obtenerPorUsuarioYContenido(
        id_usuario, 
        id_contenido_interactivo
      );
      
      res.json({
        success: true,
        data: respuestas,
        total: respuestas.length
      });
    } catch (error) {
      console.error('Error obtaining user responses:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener respuestas del usuario' 
      });
    }
  },

  crear: async (req, res) => {
    try {
      const { 
        id_contenido_interactivo, 
        id_usuario,
        respuesta_usuario,
        tiempo_respuesta_segundos,
        id_opcion_seleccionada 
      } = req.body;
      
      const validation = validateResponseInput({
        id_contenido_interactivo,
        id_usuario,
        respuesta_usuario,
        tiempo_respuesta_segundos
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          field: validation.field
        });
      }
      
      const contenido = await ContenidoInteractivo.obtenerPorId(id_contenido_interactivo);
      
      if (!contenido || !contenido.esta_activo) {
        return res.status(404).json({
          success: false,
          error: 'Contenido interactivo no encontrado o inactivo'
        });
      }
      
      const respuestaExistente = await RespuestaInteraccionModel.obtenerRespuestaCorrecta(
        id_usuario, 
        id_contenido_interactivo
      );
      
      if (respuestaExistente) {
        return res.status(409).json({
          success: false,
          error: 'Ya has respondido correctamente a esta interacción',
          es_correcta: true,
          permitir_reintento: false,
          puntos_previos: respuestaExistente.puntos_obtenidos
        });
      }
      
      const validationResult = await validateResponse(contenido, {
        respuesta_usuario,
        id_opcion_seleccionada
      });
      
      const puntos = calculatePoints(validationResult.es_correcta, contenido, tiempo_respuesta_segundos);
      
      const nuevaRespuesta = await RespuestaInteraccionModel.crear({
        id_contenido_interactivo,
        id_usuario,
        respuesta_usuario,
        id_opcion_seleccionada,
        es_correcta: validationResult.es_correcta,
        puntos_obtenidos: validationResult.es_correcta ? puntos : 0,
        tiempo_respuesta_segundos: tiempo_respuesta_segundos || 0,
        fecha_respuesta: new Date()
      });
      
      const response = {
        success: true,
        data: nuevaRespuesta,
        es_correcta: validationResult.es_correcta,
        puntos_obtenidos: validationResult.es_correcta ? puntos : 0,
        explicacion: validationResult.explicacion,
        permitir_reintento: !validationResult.es_correcta && contenido.permite_reintentos
      };
      
      if (validationResult.es_correcta) {
        response.message = 'Respuesta correcta guardada exitosamente';
        response.siguiente_interaccion = await getNextInteraction(contenido.id_video, contenido.tiempo_activacion_segundos);
      } else {
        response.message = 'Respuesta incorrecta';
        response.respuesta_correcta = contenido.mostrar_respuesta_correcta ? 
          await getRespuestaCorrecta(contenido) : null;
      }
      
      res.status(validationResult.es_correcta ? 201 : 400).json(response);
      
    } catch (error) {
      console.error('Error creating response:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al procesar la respuesta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  obtenerProgresoPorVideo: async (req, res) => {
    try {
      const { id_usuario, id_video } = req.params;
      
      const progreso = await RespuestaInteraccionModel.obtenerProgresoPorVideo(
        id_usuario, 
        id_video
      );
      
      res.json({
        success: true,
        data: progreso
      });
      
    } catch (error) {
      console.error('Error obtaining video progress:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener progreso del video' 
      });
    }
  },

  obtenerEstadisticas: async (req, res) => {
    try {
      const { id_contenido_interactivo } = req.params;
      
      const stats = await RespuestaInteraccionModel.obtenerEstadisticas(id_contenido_interactivo);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Error obtaining statistics:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener estadísticas' 
      });
    }
  }
};

function validateResponseInput(data) {
  if (!data.id_contenido_interactivo) {
    return { isValid: false, error: 'ID de contenido interactivo es obligatorio', field: 'id_contenido_interactivo' };
  }
  
  if (!data.id_usuario) {
    return { isValid: false, error: 'ID de usuario es obligatorio', field: 'id_usuario' };
  }
  
  if (!data.respuesta_usuario && !data.id_opcion_seleccionada) {
    return { isValid: false, error: 'Respuesta del usuario es obligatoria', field: 'respuesta_usuario' };
  }
  
  if (data.tiempo_respuesta_segundos && data.tiempo_respuesta_segundos < 0) {
    return { isValid: false, error: 'Tiempo de respuesta no puede ser negativo', field: 'tiempo_respuesta_segundos' };
  }
  
  return { isValid: true };
}

async function validateResponse(contenido, respuestaData) {
  try {
    switch (contenido.id_tipo_interaccion) {
      case 1:
        return await validateMultipleChoice(contenido, respuestaData);
      case 2:
        return validateTextInput(contenido, respuestaData);
      case 3:
        return validateTrueFalse(contenido, respuestaData);
      default:
        return { es_correcta: false, explicacion: 'Tipo de interacción no soportado' };
    }
  } catch (error) {
    console.error('Error validating response:', error);
    return { es_correcta: false, explicacion: 'Error en validación' };
  }
}

async function validateMultipleChoice(contenido, respuestaData) {
  if (!respuestaData.id_opcion_seleccionada) {
    return { es_correcta: false, explicacion: 'Debe seleccionar una opción' };
  }
  
  const opcion = await OpcionInteraccionModel.obtenerPorId(respuestaData.id_opcion_seleccionada);
  
  if (!opcion || opcion.id_contenido_interactivo !== contenido.id) {
    return { es_correcta: false, explicacion: 'Opción inválida' };
  }
  
  return {
    es_correcta: opcion.es_correcta,
    explicacion: opcion.explicacion || (opcion.es_correcta ? 'Respuesta correcta' : 'Respuesta incorrecta')
  };
}

function validateTextInput(contenido, respuestaData) {
  const respuestaUsuario = respuestaData.respuesta_usuario?.trim().toLowerCase();
  const respuestaCorrecta = contenido.respuesta_correcta?.trim().toLowerCase();
  
  if (!respuestaUsuario) {
    return { es_correcta: false, explicacion: 'Debe ingresar una respuesta' };
  }
  
  const es_correcta = respuestaUsuario === respuestaCorrecta;
  
  return {
    es_correcta,
    explicacion: es_correcta ? 'Respuesta correcta' : `La respuesta correcta es: ${contenido.respuesta_correcta}`
  };
}

function validateTrueFalse(contenido, respuestaData) {
  const respuestaUsuario = respuestaData.respuesta_usuario?.toLowerCase();
  const respuestaCorrecta = contenido.respuesta_correcta?.toLowerCase();
  
  if (!['true', 'false', 'verdadero', 'falso'].includes(respuestaUsuario)) {
    return { es_correcta: false, explicacion: 'Debe responder Verdadero o Falso' };
  }
  
  const normalizedUser = ['true', 'verdadero'].includes(respuestaUsuario);
  const normalizedCorrect = ['true', 'verdadero'].includes(respuestaCorrecta);
  
  return {
    es_correcta: normalizedUser === normalizedCorrect,
    explicacion: normalizedUser === normalizedCorrect ? 'Respuesta correcta' : `La respuesta correcta es: ${respuestaCorrecta}`
  };
}

function calculatePoints(es_correcta, contenido, tiempo_respuesta) {
  if (!es_correcta) return 0;
  
  let puntos = contenido.puntos_base || 10;
  
  if (tiempo_respuesta && contenido.tiempo_limite) {
    const porcentajeTiempo = tiempo_respuesta / contenido.tiempo_limite;
    if (porcentajeTiempo <= 0.5) {
      puntos = Math.round(puntos * 1.5);
    } else if (porcentajeTiempo <= 0.75) {
      puntos = Math.round(puntos * 1.25);
    }
  }
  
  return puntos;
}

async function getNextInteraction(id_video, tiempo_actual) {
  try {
    return await ContenidoInteractivo.obtenerSiguienteInteraccion(id_video, tiempo_actual);
  } catch (error) {
    console.error('Error getting next interaction:', error);
    return null;
  }
}

async function getRespuestaCorrecta(contenido) {
  try {
    if (contenido.id_tipo_interaccion === 1) {
      const opciones = await OpcionInteraccionModel.obtenerPorContenido(contenido.id);
      return opciones.find(o => o.es_correcta);
    }
    return { respuesta: contenido.respuesta_correcta };
  } catch (error) {
    console.error('Error getting correct answer:', error);
    return null;
  }
}

module.exports = RespuestaInteraccionController;