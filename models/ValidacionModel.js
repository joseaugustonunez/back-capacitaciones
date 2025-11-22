class ValidacionModel {
  
  static validarCamposObligatorios(datos, camposRequeridos) {
    const camposFaltantes = camposRequeridos.filter(campo => !datos[campo]);
    
    return {
      valido: camposFaltantes.length === 0,
      camposFaltantes
    };
  }

  static validarIdNumerico(id, nombreCampo = 'ID') {
    if (!id || isNaN(parseInt(id))) {
      return {
        valido: false,
        mensaje: `${nombreCampo} inválido`
      };
    }
    
    return { valido: true };
  }

  static validarTipoInteraccion(tipoInteraccion, tiposValidos) {
    const id_tipo_interaccion = Object.keys(tiposValidos).find(
      key => tiposValidos[key] === tipoInteraccion
    );

    if (!id_tipo_interaccion) {
      return {
        valido: false,
        mensaje: "Tipo de interacción no válido",
        tipos_validos: Object.values(tiposValidos)
      };
    }

    return {
      valido: true,
      id_tipo_interaccion: parseInt(id_tipo_interaccion)
    };
  }

  static validarParametrosProgreso(idUsuario, idVideo, tiempoActual) {
    const errores = [];
    
    if (!idUsuario) errores.push('id_usuario es obligatorio');
    if (!idVideo) errores.push('id_video es obligatorio');
    if (tiempoActual === undefined) errores.push('tiempo_actual es obligatorio');

    return {
      valido: errores.length === 0,
      errores
    };
  }

  static validarDatosRespuesta(idUsuario, idContenidoInteractivo, datosRespuesta) {
    const errores = [];
    
    if (!idUsuario) errores.push('id_usuario es obligatorio');
    if (!idContenidoInteractivo) errores.push('id_contenido_interactivo es obligatorio');
    if (!datosRespuesta) errores.push('datos_respuesta es obligatorio');

    return {
      valido: errores.length === 0,
      errores
    };
  }

  static validarDatosActualizacion(datos) {
    if (!datos || Object.keys(datos).length === 0) {
      return {
        valido: false,
        mensaje: 'No hay campos para actualizar'
      };
    }
    
    return { valido: true };
  }

  static validarLimite(limite, valorDefecto = 10) {
    const limiteNumerico = parseInt(limite);
    return isNaN(limiteNumerico) ? valorDefecto : limiteNumerico;
  }
}

module.exports = ValidacionModel;