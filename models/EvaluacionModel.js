class EvaluacionModel {

  static evaluarRespuesta(tipoInteraccion, datosRespuesta, interaccion) {
    const evaluacion = {
      es_correcta: false,
      retroalimentacion: '',
      detalles: {}
    };

    try {
      switch (tipoInteraccion) {
        case 'cuestionario':
          return this.evaluarCuestionario(datosRespuesta, interaccion);

        case 'encuesta':
        case 'calificacion':
        case 'votacion':
          evaluacion.es_correcta = true;
          evaluacion.retroalimentacion = 'Respuesta registrada correctamente';
          break;

        case 'completar_espacios':
          return this.evaluarCompletarEspacios(datosRespuesta, interaccion);

        case 'arrastrar_soltar':
          return this.evaluarArrastrarSoltar(datosRespuesta, interaccion);

        case 'entrada_texto':
          return this.evaluarEntradaTexto(datosRespuesta, interaccion);

        case 'puntos_interaccion':
          return this.evaluarPuntosInteraccion(datosRespuesta, interaccion);

        default:
          evaluacion.retroalimentacion = 'Tipo de interacción no reconocido';
      }
    } catch (error) {
      console.error('Error al evaluar respuesta:', error);
      evaluacion.retroalimentacion = 'Error al evaluar la respuesta';
    }

    return evaluacion;
  }

  static evaluarCuestionario(datosRespuesta, interaccion) {
    const opcionesCorrectas = interaccion.opciones
      .filter(op => op.es_correcta)
      .map(op => op.id);

    const respuestasUsuario = Array.isArray(datosRespuesta.opciones_seleccionadas)
      ? datosRespuesta.opciones_seleccionadas
      : [datosRespuesta.opciones_seleccionadas];

    const esCorrecta = opcionesCorrectas.length === respuestasUsuario.length &&
      opcionesCorrectas.every(id => respuestasUsuario.includes(id));

    const explicaciones = interaccion.opciones
      .filter(op => respuestasUsuario.includes(op.id) && op.explicacion)
      .map(op => op.explicacion);

    return {
      es_correcta: esCorrecta,
      retroalimentacion: esCorrecta ?
        '¡Correcto! Has seleccionado la respuesta correcta.' :
        'Respuesta incorrecta. Intenta de nuevo.',
      detalles: {
        opciones_correctas: opcionesCorrectas,
        opciones_seleccionadas: respuestasUsuario,
        explicaciones
      }
    };
  }

  static evaluarCompletarEspacios(datosRespuesta, interaccion) {
    const opcionesCorrectas = interaccion.opciones
      .filter(op => op.es_correcta)
      .map(op => op.id);

    const respuestasUsuario = Array.isArray(datosRespuesta.opciones_seleccionadas)
      ? datosRespuesta.opciones_seleccionadas
      : [datosRespuesta.opciones_seleccionadas];

    const esCorrecta = opcionesCorrectas.length === respuestasUsuario.length &&
      opcionesCorrectas.every(id => respuestasUsuario.includes(id));

    const explicaciones = interaccion.opciones
      .filter(op => respuestasUsuario.includes(op.id) && op.explicacion)
      .map(op => op.explicacion);

    return {
      es_correcta: esCorrecta,
      retroalimentacion: esCorrecta ?
        '¡Correcto! Has seleccionado la respuesta correcta.' :
        'Respuesta incorrecta. Intenta de nuevo.',
      detalles: {
        opciones_correctas: opcionesCorrectas,
        opciones_seleccionadas: respuestasUsuario,
        explicaciones
      }
    };
  }


  static evaluarArrastrarSoltar(datosRespuesta, interaccion) {
    const opcionesCorrectas = interaccion.opciones
      .filter(op => op.es_correcta)
      .map(op => op.id);

    const respuestasUsuario = Array.isArray(datosRespuesta.opciones_seleccionadas)
      ? datosRespuesta.opciones_seleccionadas
      : [datosRespuesta.opciones_seleccionadas];

    const esCorrecta = opcionesCorrectas.length === respuestasUsuario.length &&
      opcionesCorrectas.every(id => respuestasUsuario.includes(id));

    const explicaciones = interaccion.opciones
      .filter(op => respuestasUsuario.includes(op.id) && op.explicacion)
      .map(op => op.explicacion);

    return {
      es_correcta: esCorrecta,
      retroalimentacion: esCorrecta ?
        '¡Correcto! Has seleccionado la respuesta correcta.' :
        'Respuesta incorrecta. Intenta de nuevo.',
      detalles: {
        opciones_correctas: opcionesCorrectas,
        opciones_seleccionadas: respuestasUsuario,
        explicaciones
      }
    };
  }


  static evaluarEntradaTexto(datosRespuesta, interaccion) {
    const configuracion = interaccion.configuracion;
    const respuestaCorrecta = configuracion.respuesta_correcta;
    const respuestaUsuario = datosRespuesta.texto;

    if (!respuestaCorrecta) {
      return {
        es_correcta: Boolean(respuestaUsuario && respuestaUsuario.trim().length > 0),
        retroalimentacion: 'Respuesta registrada',
        detalles: { texto_ingresado: respuestaUsuario }
      };
    }

    const esCorrecta = this.compararTexto(respuestaUsuario, respuestaCorrecta);

    return {
      es_correcta: esCorrecta,
      retroalimentacion: esCorrecta ?
        'Respuesta correcta' :
        'Respuesta incorrecta',
      detalles: {
        respuesta_usuario: respuestaUsuario,
        respuesta_correcta: respuestaCorrecta
      }
    };
  }

  static evaluarPuntosInteraccion(datosRespuesta, interaccion) {
    const configuracion = interaccion.configuracion;
    const puntosCorrectos = configuracion.puntos_correctos || [];
    const puntosUsuario = datosRespuesta.puntos_clickeados || [];

    let correctas = 0;
    const tolerancia = configuracion.tolerancia || 20;

    puntosUsuario.forEach(puntoUsuario => {
      const hayCoincidencia = puntosCorrectos.some(puntoCorrect => {
        const distancia = Math.sqrt(
          Math.pow(puntoUsuario.x - puntoCorrect.x, 2) +
          Math.pow(puntoUsuario.y - puntoCorrect.y, 2)
        );
        return distancia <= tolerancia;
      });

      if (hayCoincidencia) correctas++;
    });

    const total = puntosCorrectos.length;
    const porcentajeCorrectas = total > 0 ? (correctas / total) * 100 : 0;
    const umbralAprobacion = configuracion.umbral_aprobacion || 70;

    return {
      es_correcta: porcentajeCorrectas >= umbralAprobacion,
      retroalimentacion: `${correctas}/${total} puntos identificados correctamente`,
      detalles: {
        correctas,
        total,
        porcentaje: porcentajeCorrectas
      }
    };
  }

  static compararTexto(respuestaUsuario, respuestaCorrecta) {
    if (!respuestaUsuario || !respuestaCorrecta) return false;

    const normalizar = (texto) =>
      texto.toString().trim().toLowerCase().replace(/\s+/g, ' ');

    return normalizar(respuestaUsuario) === normalizar(respuestaCorrecta);
  }
}

module.exports = EvaluacionModel;