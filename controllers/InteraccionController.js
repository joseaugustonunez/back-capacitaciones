const ContenidoInteractivo = require('../models/ContenidoModel');
const OpcionInteraccion = require('../models/OpcionInteraccionModel');
const RespuestaInteraccion = require('../models/RespuestaInteraccionModel');
const EvaluacionModel = require('../models/EvaluacionModel');
const ProgresoModel = require('../models/ProgresosModel');
const ValidacionModel = require('../models/ValidacionModel');

/* const TIPOS_INTERACCION = {
  1: 'cuestionario',
  3: 'completar_espacios',
  4: 'arrastrar_soltar',
  6: 'entrada_texto',
  7: 'calificacion',
  8: 'votacion'
}; */
const TIPOS_INTERACCION = {
  1: 'cuestionario',
  2: 'completar_espacios',
  3: 'arrastrar_soltar',
  4: 'entrada_texto',
  5: 'calificacion',
  6: 'votacion'
};

class InteraccionController {
  static async obtenerInteraccionesPorVideo(req, res) {
    try {
      const { idVideo } = req.params;

      const validacion = ValidacionModel.validarIdNumerico(idVideo, 'ID de video');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const interacciones = await ContenidoInteractivo.obtenerPorVideo(parseInt(idVideo));

      res.json({
        success: true,
        data: interacciones,
        total: interacciones.length
      });

    } catch (error) {
      console.error('Error al obtener interacciones por video:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const validacion = ValidacionModel.validarIdNumerico(id, 'ID de interacción');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const eliminado = await ContenidoInteractivo.eliminar(parseInt(id));

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Interacción no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Interacción eliminada correctamente'
      });

    } catch (error) {
      console.error('Error al eliminar interacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async obtenerEstadisticas(req, res) {
    try {
      const { idVideo } = req.params;

      const validacion = ValidacionModel.validarIdNumerico(idVideo, 'ID de video');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const totalContenidos = await ContenidoInteractivo.contarPorVideo(parseInt(idVideo));
      const estadisticasPorTipo = await ContenidoInteractivo.obtenerEstadisticasPorTipo(parseInt(idVideo));

      const estadisticasConNombre = estadisticasPorTipo.map(stat => ({
        ...stat,
        nombre_tipo: TIPOS_INTERACCION[stat.id_tipo_interaccion] || 'desconocido'
      }));

      res.json({
        success: true,
        data: {
          total_contenidos: totalContenidos,
          por_tipo: estadisticasConNombre
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

static async crearInteraccion(req, res) {
  try {
    const {
      id_video,
      tipo_interaccion,
      titulo,
      descripcion,
      tiempo_activacion_segundos,
      configuracion = {},
      es_obligatorio = false,
      puntos = 0,
      opciones = []
    } = req.body;

    const camposRequeridos = ["id_video", "tipo_interaccion", "titulo", "tiempo_activacion_segundos"];
    const validacionCampos = ValidacionModel.validarCamposObligatorios(req.body, camposRequeridos);

    if (!validacionCampos.valido) {
      return res.status(400).json({
        success: false,
        message: `Campos obligatorios faltantes: ${validacionCampos.camposFaltantes.join(", ")}`
      });
    }

    const validacionTipo = ValidacionModel.validarTipoInteraccion(tipo_interaccion, TIPOS_INTERACCION);
    if (!validacionTipo.valido) {
      return res.status(400).json({
        success: false,
        message: validacionTipo.mensaje,
        tipos_validos: validacionTipo.tipos_validos
      });
    }

    let opcionesProcesadas = opciones;
    if (tipo_interaccion === 'votacion' && opciones.length > 0) {
      opcionesProcesadas = opciones.map(opcion => ({
        texto: opcion.texto_opcion || opcion.texto,
        explicacion: opcion.explicacion,
        orden: opcion.orden,
        es_correcta: true
      }));
    }

    if (opcionesProcesadas.length > 0) {
      const validacionOpciones = OpcionInteraccion.validarOpciones(opcionesProcesadas, tipo_interaccion);
      if (!validacionOpciones.valido) {
        return res.status(400).json({
          success: false,
          message: "Errores en las opciones",
          errores: validacionOpciones.errores
        });
      }
    }

    const idInteraccion = await ContenidoInteractivo.crear({
      id_video,
      id_tipo_interaccion: validacionTipo.id_tipo_interaccion,
      titulo,
      descripcion,
      tiempo_activacion_segundos,
      configuracion,
      es_obligatorio,
      puntos
    });

    if (opcionesProcesadas.length > 0) {
      await OpcionInteraccion.crearVarias(idInteraccion, opcionesProcesadas);
    }

    const interaccionCompleta = await ContenidoInteractivo.obtenerPorId(idInteraccion);

    res.status(201).json({
      success: true,
      data: interaccionCompleta,
      message: "Interacción creada exitosamente"
    });

  } catch (error) {
    console.error("Error al crear interacción:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear interacción",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}


  static async obtenerProgresoUsuario(req, res) {
    try {
      const { id_usuario, id_video } = req.params;

      if (!id_usuario || !id_video) {
        return res.status(400).json({
          success: false,
          message: 'id_usuario e id_video son obligatorios'
        });
      }

      const progreso = await RespuestaInteraccion.obtenerProgresoPorVideo(
        parseInt(id_usuario),
        parseInt(id_video)
      );

      const estadisticas = await ProgresoModel.calcularEstadisticasProgreso(progreso);

      res.json({
        success: true,
        data: {
          progreso,
          estadisticas
        }
      });

    } catch (error) {
      console.error('Error al obtener progreso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener progreso',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async verificarProgreso(req, res) {
    try {
      const { id_usuario, id_video, tiempo_actual } = req.query;

      const validacionParametros = ValidacionModel.validarParametrosProgreso(
        id_usuario, id_video, tiempo_actual
      );

      if (!validacionParametros.valido) {
        return res.status(400).json({
          success: false,
          message: `Parámetros requeridos faltantes: ${validacionParametros.errores.join(', ')}`
        });
      }

      const verificacion = await ProgresoModel.verificarInteraccionesObligatorias(
        parseInt(id_usuario),
        parseInt(id_video),
        parseFloat(tiempo_actual)
      );

      res.json({
        success: true,
        data: verificacion
      });

    } catch (error) {
      console.error('Error al verificar progreso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar progreso',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async obtenerInteraccion(req, res) {
    try {
      const { id } = req.params;

      const validacion = ValidacionModel.validarIdNumerico(id, 'ID de interacción');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const interaccion = await ContenidoInteractivo.obtenerPorId(parseInt(id));

      if (!interaccion) {
        return res.status(404).json({
          success: false,
          message: 'Interacción no encontrada'
        });
      }

      res.json({
        success: true,
        data: interaccion
      });

    } catch (error) {
      console.error('Error al obtener interacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener interacción',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
 static async actualizarContenido(req, res) {
  try {
    const { id } = req.params;
    const datos = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'id' no es válido",
      });
    }

    const actualizado = await ContenidoInteractivo.actualizar(id, datos);

    if (!actualizado) {
      return res.status(404).json({
        success: false,
        message: "No se encontró la interacción o no se actualizaron campos",
      });
    }

    return res.json({
      success: true,
      message: "Interacción actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar contenido:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
}
 static async actualizar(id, datos) {
  const campos = [];
  const valores = [];

  const columnasValidas = [
    "id_video",
    "id_tipo_interaccion",
    "titulo",
    "descripcion",
    "tiempo_activacion_segundos",
    "configuracion",
    "es_obligatorio",
    "puntos",
    "indice_orden",
    "esta_activo",
    "fecha_actualizacion",
    "pregunta",
    "longitud_maxima",
    "respuesta_correcta"
  ];

  Object.keys(datos).forEach(campo => {
    if (columnasValidas.includes(campo) && datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      if (campo === "configuracion" && typeof datos[campo] === "object") {
        valores.push(JSON.stringify(datos[campo]));
      } else {
        valores.push(datos[campo]);
      }
    }
  });

  if (campos.length === 0) return false;

  valores.push(id);
  const query = `UPDATE contenido_interactivo SET ${campos.join(", ")} WHERE id = ?`;

  const [result] = await db.execute(query, valores);
  return result.affectedRows > 0;
} 

  static async desactivarInteraccion(req, res) {
    try {
      const { id } = req.params;

      const validacion = ValidacionModel.validarIdNumerico(id, 'ID de interacción');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const desactivado = await ContenidoInteractivo.desactivar(parseInt(id));

      if (!desactivado) {
        return res.status(404).json({
          success: false,
          message: 'Interacción no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Interacción desactivada correctamente'
      });

    } catch (error) {
      console.error('Error al desactivar interacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar interacción',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async obtenerRanking(req, res) {
    try {
      const { id_video } = req.params;
      const limite = ValidacionModel.validarLimite(req.query.limite, 10);

      const validacion = ValidacionModel.validarIdNumerico(id_video, 'ID de video');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const ranking = await RespuestaInteraccion.obtenerRankingPorVideo(
        parseInt(id_video),
        limite
      );

      res.json({
        success: true,
        data: ranking
      });

    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ranking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async reiniciarProgreso(req, res) {
    try {
      const { id_usuario, id_video } = req.body;

      if (!id_usuario || !id_video) {
        return res.status(400).json({
          success: false,
          message: 'id_usuario e id_video son obligatorios'
        });
      }

      const reiniciado = await RespuestaInteraccion.reiniciarProgreso(
        parseInt(id_usuario),
        parseInt(id_video)
      );

      res.json({
        success: true,
        message: reiniciado ?
          'Progreso del usuario reiniciado correctamente' :
          'No había progreso previo para reiniciar'
      });

    } catch (error) {
      console.error('Error al reiniciar progreso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reiniciar progreso',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async procesarRespuesta(req, res) {
  try {
    const {
      id_usuario,
      id_contenido_interactivo,
      datos_respuesta,
      tiempo_respuesta_segundos = 0
    } = req.body;

    const validacionDatos = ValidacionModel.validarDatosRespuesta(
      id_usuario, id_contenido_interactivo, datos_respuesta
    );

    if (!validacionDatos.valido) {
      return res.status(400).json({
        success: false,
        message: `Campos obligatorios faltantes: ${validacionDatos.errores.join(', ')}`
      });
    }

    const interaccion = await ContenidoInteractivo.obtenerPorId(id_contenido_interactivo);
    if (!interaccion) {
      return res.status(404).json({
        success: false,
        message: 'Interacción no encontrada'
      });
    }

    const intentoAnterior = await RespuestaInteraccion.obtenerUltimoIntento(
      id_usuario,
      id_contenido_interactivo
    );
    const numeroIntento = intentoAnterior ? intentoAnterior.numero_intento + 1 : 1;

    const tipoInteraccion = TIPOS_INTERACCION[interaccion.id_tipo_interaccion];
    const evaluacion = EvaluacionModel.evaluarRespuesta(
      tipoInteraccion,
      datos_respuesta,
      interaccion
    );

    const puntosObtenidos = ProgresoModel.calcularPuntosObtenidos(evaluacion, interaccion);

    const idRespuesta = await RespuestaInteraccion.crear({
      id_usuario,
      id_contenido_interactivo,
      datos_respuesta,
      es_correcta: evaluacion.es_correcta,
      puntos_obtenidos: puntosObtenidos,
      numero_intento: numeroIntento,
      tiempo_respuesta_segundos
    });

    const debeRetroceder = ProgresoModel.determinarDebeRetroceder(interaccion, evaluacion);

    let tiempoRetroceso = null;
    if (debeRetroceder) {
      tiempoRetroceso = await ContenidoInteractivo.calcularTiempoRetroceso(interaccion);
    }

    res.json({
      success: true,
      data: {
        id_respuesta: idRespuesta,
        evaluacion,
        debe_retroceder: debeRetroceder,
        tiempo_retroceso: tiempoRetroceso,
        puntos_obtenidos: puntosObtenidos,
        numero_intento: numeroIntento
      }
    });

  } catch (error) {
    console.error('Error al procesar respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar respuesta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


  static async obtenerEstadisticasInteraccion(req, res) {
    try {
      const { id_interaccion } = req.params;

      const validacion = ValidacionModel.validarIdNumerico(id_interaccion, 'ID de interacción');
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      const estadisticas = await ProgresoModel.obtenerEstadisticasInteraccion(parseInt(id_interaccion));

      res.json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = InteraccionController;