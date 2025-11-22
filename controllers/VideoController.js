// controllers/videoController.js
const VideoModel = require('../models/VideoModel');
const videoService = require('../services/videoService');
const path = require('path');
const fs = require('fs').promises;

const VideoController = {
  // Crear nuevo video
  crear: async (req, res) => {
  let rutaVideoGuardada = null;
  let rutaMiniaturaGuardada = null;

  try {
    const {
      id_modulo,
      titulo,
      descripcion,
      indice_orden,
      es_vista_previa,
      transcripcion,
      url_video // <-- link opcional
    } = req.body;

    if (!id_modulo || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Los campos id_modulo y titulo son obligatorios'
      });
    }

    const moduloExiste = await VideoModel.verificarModulo(id_modulo);
    if (!moduloExiste) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'El módulo especificado no existe'
      });
    }

    const tituloExiste = await VideoModel.existeTituloEnModulo(titulo, id_modulo);
    if (tituloExiste) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'Ya existe un video con ese título en este módulo'
      });
    }

    let duracion = 0;
    let videoPathFinal = null;
    let thumbnailFinal = null;

    if (req.file) {
      // Procesar archivo
      const videoPath = req.file.path;
      const { duration, thumbnailPath } = await videoService.processVideo(videoPath);

      rutaVideoGuardada = path.join('videos', path.basename(videoPath));
      rutaMiniaturaGuardada = path.join('thumbnails', path.basename(thumbnailPath));

      duracion = Math.floor(duration);
      videoPathFinal = rutaVideoGuardada;
      thumbnailFinal = rutaMiniaturaGuardada;

    } else if (url_video) {
      // Usar link directamente
      videoPathFinal = url_video;
      thumbnailFinal = null; // opcional, se podría dejar vacío
      // ⬇️ Usa la duración enviada por el frontend si existe
      duracion = req.body.duracion_segundos ? parseInt(req.body.duracion_segundos) : 0;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un archivo de video o un link de video'
      });
    }

    let ordenFinal = indice_orden;
    if (!ordenFinal) {
      ordenFinal = await VideoModel.obtenerSiguienteOrden(id_modulo);
    }

    const videoData = {
      id_modulo,
      titulo,
      descripcion: descripcion || null,
      url_video: videoPathFinal,
      url_miniatura: thumbnailFinal,
      duracion_segundos: duracion,
      indice_orden: ordenFinal,
      es_vista_previa: Number(es_vista_previa) || 0,
      transcripcion: transcripcion || null
    };

    const result = await VideoModel.crear(videoData);
    const videoCreado = await VideoModel.buscarPorId(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Video creado exitosamente',
      data: {
        ...videoCreado,
        url_video: videoCreado.url_video && !url_video ? `/uploads/${videoCreado.url_video}` : videoCreado.url_video,
        url_miniatura: videoCreado.url_miniatura ? `/uploads/${videoCreado.url_miniatura}` : null
      }
    });

  } catch (error) {
    console.error('❌ Error creando video:', error);

    if (rutaVideoGuardada) {
      await fs.unlink(path.join('uploads', rutaVideoGuardada)).catch(console.error);
    }
    if (rutaMiniaturaGuardada) {
      await fs.unlink(path.join('uploads', rutaMiniaturaGuardada)).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear el video',
      error: error.message
    });
  }
},


  // Listar todos los videos
  listar: async (req, res) => {
    try {
      const { page = 1, limit = 50, id_modulo } = req.query;

      let videos;
      if (id_modulo) {
        videos = await VideoModel.listarPorModulo(id_modulo);
      } else {
        videos = await VideoModel.listar();
      }

      // Convertir rutas a URLs para el frontend
     const videosConUrls = videos.map(video => ({
  ...video,
  url_video: video.url_video
    ? (video.url_video.startsWith('http') ? video.url_video : `/uploads/videos/${path.basename(video.url_video)}`)
    : null,
  url_miniatura: video.url_miniatura
    ? `/uploads/thumbnails/${path.basename(video.url_miniatura)}`
    : null,
  es_vista_previa: Boolean(video.es_vista_previa)
}));
      // Implementar paginación
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const videosPaginados = videosConUrls.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: videosPaginados,
        pagination: {
          total: videosConUrls.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(videosConUrls.length / limit)
        }
      });
    } catch (error) {
      console.error('❌ Error listando videos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los videos',
        error: error.message
      });
    }
  },

  // Obtener video por ID
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const video = await VideoModel.buscarPorId(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      // Convertir rutas a URLs
      const videoConUrls = {
        ...video,
        url_video: video.url_video ? `/uploads/videos/${path.basename(video.url_video)}` : null,
        url_miniatura: video.url_miniatura ? `/uploads/thumbnails/${path.basename(video.url_miniatura)}` : null,
        es_vista_previa: Boolean(video.es_vista_previa)
      };

      res.json({
        success: true,
        data: videoConUrls
      });
    } catch (error) {
      console.error('❌ Error obteniendo video:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el video',
        error: error.message
      });
    }
  },

  // Actualizar video
  actualizar: async (req, res) => {
    let nuevaRutaVideo = null;
    let nuevaRutaMiniatura = null;

    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      // Verificar que el video existe
      const videoExistente = await VideoModel.buscarPorId(id);
      if (!videoExistente) {
        // Limpiar archivo subido si existe
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      // Si se cambia el módulo, verificar que existe
      if (datosActualizacion.id_modulo && datosActualizacion.id_modulo !== videoExistente.id_modulo.toString()) {
        const moduloExiste = await VideoModel.verificarModulo(datosActualizacion.id_modulo);
        if (!moduloExiste) {
          if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
          }
          return res.status(400).json({
            success: false,
            message: 'El módulo especificado no existe'
          });
        }
      }

      // Si se cambia el título, verificar que no exista otro con el mismo nombre
      if (datosActualizacion.titulo && datosActualizacion.titulo !== videoExistente.titulo) {
        const moduloId = datosActualizacion.id_modulo || videoExistente.id_modulo;
        const tituloExiste = await VideoModel.existeTituloEnModulo(
          datosActualizacion.titulo,
          moduloId,
          id
        );
        if (tituloExiste) {
          if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
          }
          return res.status(400).json({
            success: false,
            message: 'Ya existe un video con ese título en este módulo'
          });
        }
      }

      let datosFinales = { ...datosActualizacion };

      // Si se subió un nuevo video
      if (req.file) {
        const videoPath = req.file.path;
        nuevaRutaVideo = videoPath;

        // Procesar nuevo video
        const { duration, thumbnailPath } = await videoService.processVideo(videoPath);
        nuevaRutaMiniatura = thumbnailPath;

        datosFinales.url_video = nuevaRutaVideo;
        datosFinales.url_miniatura = nuevaRutaMiniatura;
        datosFinales.duracion_segundos = Math.round(duration);

        // Eliminar archivos antiguos
        if (videoExistente.url_video && await fs.access(videoExistente.url_video).then(() => true).catch(() => false)) {
          await fs.unlink(videoExistente.url_video).catch(console.error);
        }
        if (videoExistente.url_miniatura && await fs.access(videoExistente.url_miniatura).then(() => true).catch(() => false)) {
          await fs.unlink(videoExistente.url_miniatura).catch(console.error);
        }
      }

      // Convertir es_vista_previa a boolean
      if (datosFinales.es_vista_previa !== undefined) {
        datosFinales.es_vista_previa = Number(datosFinales.es_vista_previa) || 0;
      }

      const result = await VideoModel.actualizar(id, datosFinales);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado o no se realizaron cambios'
        });
      }

      // Obtener el video actualizado
      const videoActualizado = await VideoModel.buscarPorId(id);

      res.json({
        success: true,
        message: 'Video actualizado exitosamente',
        data: {
          ...videoActualizado,
          url_video: videoActualizado.url_video ? `/uploads/videos/${path.basename(videoActualizado.url_video)}` : null,
          url_miniatura: videoActualizado.url_miniatura ? `/uploads/thumbnails/${path.basename(videoActualizado.url_miniatura)}` : null,
          es_vista_previa: Boolean(videoActualizado.es_vista_previa)
        }
      });
    } catch (error) {
      console.error('❌ Error actualizando video:', error);

      // Limpiar nuevos archivos si hubo error
      if (nuevaRutaVideo) {
        await fs.unlink(nuevaRutaVideo).catch(console.error);
      }
      if (nuevaRutaMiniatura) {
        await fs.unlink(nuevaRutaMiniatura).catch(console.error);
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar el video',
        error: error.message
      });
    }
  },

  // Eliminar video
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el video existe y obtener rutas de archivos
      const video = await VideoModel.buscarPorId(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      const result = await VideoModel.eliminar(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      // Eliminar archivos del sistema de archivos
      if (video.url_video) {
        const rutaVideo = path.join(__dirname, '..', video.url_video); // Ajusta según tu estructura
        await fs.unlink(rutaVideo).catch(error => {
          console.error('Error eliminando archivo de video:', error.message);
        });
      }

      if (video.url_miniatura) {
        const rutaMiniatura = path.join(__dirname, '..', video.url_miniatura);
        await fs.unlink(rutaMiniatura).catch(error => {
          console.error('Error eliminando archivo de miniatura:', error.message);
        });
      }


      res.json({
        success: true,
        message: 'Video eliminado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error eliminando video:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el video',
        error: error.message
      });
    }
  },

listarPorModulo: async (req, res) => {
  try {
    const { id_modulo } = req.params;
    const { incluir_vistas_previa = "true" } = req.query;

    const incluirVistasPrevia = incluir_vistas_previa === "true";
    const videos = await VideoModel.listarPorModulo(id_modulo, incluirVistasPrevia);

    const videosConUrls = videos.map(video => {
      // Si la ruta ya es una URL externa, se devuelve igual
      const urlVideo = video.url_video
        ? video.url_video.startsWith("http")
          ? video.url_video
          : `/uploads/videos/${path.basename(video.url_video)}`
        : null;

      const urlMiniatura = video.url_miniatura
        ? video.url_miniatura.startsWith("http")
          ? video.url_miniatura
          : `/uploads/thumbnails/${path.basename(video.url_miniatura)}`
        : null;

      return {
        ...video,
        url_video: urlVideo,
        url_miniatura: urlMiniatura,
        es_vista_previa: Boolean(video.es_vista_previa)
      };
    });

    res.json({
      success: true,
      data: videosConUrls,
      total: videosConUrls.length
    });
  } catch (error) {
    console.error("❌ Error obteniendo videos por módulo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los videos del módulo",
      error: error.message
    });
  }
}
,
  // Reordenar videos
  reordenar: async (req, res) => {
    try {
      const { videos } = req.body;

      if (!Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se debe proporcionar un array de videos válido'
        });
      }

      // Validar que cada video tenga id y orden
      for (const video of videos) {
        if (!video.id || video.orden === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Cada video debe tener id y orden'
          });
        }
      }

      await VideoModel.reordenar(videos);

      res.json({
        success: true,
        message: 'Videos reordenados exitosamente'
      });
    } catch (error) {
      console.error('❌ Error reordenando videos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reordenar los videos',
        error: error.message
      });
    }
  },

  // Duplicar video (mantiene referencia a los mismos archivos)
  duplicar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nuevo_titulo } = req.body;

      if (!nuevo_titulo || nuevo_titulo.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nuevo título es obligatorio'
        });
      }

      const result = await VideoModel.duplicar(id, nuevo_titulo.trim());

      res.status(201).json({
        success: true,
        message: 'Video duplicado exitosamente',
        data: {
          id: result.insertId,
          nuevo_orden: result.nuevoOrden
        }
      });
    } catch (error) {
      console.error('❌ Error duplicando video:', error);

      if (error.message === 'Video no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al duplicar el video',
        error: error.message
      });
    }
  },

  // Cambiar estado de vista previa
  cambiarVistaPrevia: async (req, res) => {
    try {
      const { id } = req.params;
      const { es_vista_previa } = req.body;

      if (es_vista_previa === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El campo es_vista_previa es obligatorio'
        });
      }

      const result = await VideoModel.cambiarVistaPrevia(id, Boolean(es_vista_previa));

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      res.json({
        success: true,
        message: `Video ${es_vista_previa ? 'marcado como' : 'removido de'} vista previa`
      });
    } catch (error) {
      console.error('❌ Error cambiando vista previa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar el estado de vista previa',
        error: error.message
      });
    }
  },

  // Buscar videos
  buscar: async (req, res) => {
    try {
      const { q: textoBusqueda, id_modulo, limite = 50 } = req.query;

      if (!textoBusqueda || textoBusqueda.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El parámetro de búsqueda "q" es obligatorio'
        });
      }

      const videos = await VideoModel.buscar(textoBusqueda, id_modulo, parseInt(limite));

      // Convertir rutas a URLs
      const videosConUrls = videos.map(video => ({
        ...video,
        url_video: video.url_video ? `/uploads/videos/${path.basename(video.url_video)}` : null,
        url_miniatura: video.url_miniatura ? `/uploads/thumbnails/${path.basename(video.url_miniatura)}` : null,
        es_vista_previa: Boolean(video.es_vista_previa)
      }));

      res.json({
        success: true,
        data: videosConUrls,
        total: videosConUrls.length,
        termino_busqueda: textoBusqueda
      });
    } catch (error) {
      console.error('❌ Error buscando videos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar videos',
        error: error.message
      });
    }
  },

  // Obtener vistas previa
  listarVistasPrevia: async (req, res) => {
    try {
      const vistasPrevia = await VideoModel.listarVistasPrevia();

      // Convertir rutas a URLs
      const vistasConUrls = vistasPrevia.map(video => ({
        ...video,
        url_video: video.url_video ? `/uploads/videos/${path.basename(video.url_video)}` : null,
        url_miniatura: video.url_miniatura ? `/uploads/thumbnails/${path.basename(video.url_miniatura)}` : null,
        es_vista_previa: Boolean(video.es_vista_previa)
      }));

      res.json({
        success: true,
        data: vistasConUrls,
        total: vistasConUrls.length
      });
    } catch (error) {
      console.error('❌ Error obteniendo vistas previa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las vistas previa',
        error: error.message
      });
    }
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (req, res) => {
    try {
      const estadisticas = await VideoModel.obtenerEstadisticas();

      // Convertir segundos a formato legible
      const horas = Math.floor(estadisticas.duracion_total_segundos / 3600);
      const minutos = Math.floor((estadisticas.duracion_total_segundos % 3600) / 60);
      const segundos = estadisticas.duracion_total_segundos % 60;

      res.json({
        success: true,
        data: {
          ...estadisticas,
          duracion_total_formateada: `${horas}h ${minutos}m ${segundos}s`,
          duracion_promedio_formateada: `${Math.floor(estadisticas.duracion_promedio_segundos / 60)}m ${Math.floor(estadisticas.duracion_promedio_segundos % 60)}s`
        }
      });
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        error: error.message
      });
    }
  },

  // Actualizar transcripción
  actualizarTranscripcion: async (req, res) => {
    try {
      const { id } = req.params;
      const { transcripcion } = req.body;

      const result = await VideoModel.actualizarTranscripcion(id, transcripcion);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Transcripción actualizada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error actualizando transcripción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la transcripción',
        error: error.message
      });
    }
  },

  // Obtener duración total por módulo
  obtenerDuracionPorModulo: async (req, res) => {
    try {
      const { id_modulo } = req.params;

      const estadisticas = await VideoModel.obtenerDuracionTotalPorModulo(id_modulo);

      // Convertir segundos a formato legible
      const horas = Math.floor(estadisticas.duracion_total_segundos / 3600);
      const minutos = Math.floor((estadisticas.duracion_total_segundos % 3600) / 60);
      const segundos = estadisticas.duracion_total_segundos % 60;

      res.json({
        success: true,
        data: {
          ...estadisticas,
          duracion_total_formateada: `${horas}h ${minutos}m ${segundos}s`
        }
      });
    } catch (error) {
      console.error('❌ Error obteniendo duración por módulo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la duración del módulo',
        error: error.message
      });
    }
  },

  // Generar miniatura desde video existente
  generarMiniatura: async (req, res) => {
    try {
      const { id } = req.params;

      const video = await VideoModel.buscarPorId(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      if (!video.url_video) {
        return res.status(400).json({
          success: false,
          message: 'El video no tiene archivo asociado'
        });
      }

      // Generar nueva miniatura
      const { thumbnailPath } = await videoService.generateThumbnail(video.url_video);

      // Eliminar miniatura anterior si existe
      if (video.url_miniatura) {
        await fs.unlink(video.url_miniatura).catch(console.error);
      }

      // Actualizar base de datos con nueva miniatura
      await VideoModel.actualizar(id, { url_miniatura: thumbnailPath });

      res.json({
        success: true,
        message: 'Miniatura generada exitosamente',
        data: {
          url_miniatura: `/uploads/thumbnails/${path.basename(thumbnailPath)}`
        }
      });

    } catch (error) {
      console.error('❌ Error generando miniatura:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar la miniatura',
        error: error.message
      });
    }
  }
};

module.exports = VideoController;