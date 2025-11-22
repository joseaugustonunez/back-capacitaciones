const ProgresoVideoModel = require('../models/ProgresoModel');
const VideoModel = require('../models/VideoModel');
const progresoController = {

  listar: async (req, res) => {
    try {
      const resultados = await ProgresoVideoModel.listar();
      res.json({
        success: true,
        data: resultados
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener los progresos de videos' 
      });
    }
  },

  obtener: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'ID inválido' 
        });
      }

      const progreso = await ProgresoVideoModel.buscarPorId(id);
      if (!progreso) {
        return res.status(404).json({ 
          success: false,
          error: 'Progreso no encontrado' 
        });
      }

      res.json({
        success: true,
        data: progreso
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener el progreso de video' 
      });
    }
  },

  obtenerPorUsuarioYVideo: async (req, res) => {
    try {
      const { userId, videoId } = req.params;
      
      if (!userId || !videoId) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren userId y videoId'
        });
      }

      const progreso = await ProgresoVideoModel.buscarPorUsuarioYVideo(
        parseInt(userId), 
        parseInt(videoId)
      );

      res.json({
        success: true,
        data: progreso
      });
    } catch (err) {
      console.error('Error al obtener progreso por usuario y video:', err);
      res.status(500).json({
        success: false,
        error: 'Error al obtener el progreso del video'
      });
    }
  },

  obtenerPorUsuario: async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere userId'
        });
      }

      const progresos = await ProgresoVideoModel.buscarPorUsuario(parseInt(userId));

      res.json({
        success: true,
        data: progresos
      });
    } catch (err) {
      console.error('Error al obtener progresos del usuario:', err);
      res.status(500).json({
        success: false,
        error: 'Error al obtener los progresos del usuario'
      });
    }
  },

   crear: async (req, res) => {
    try {
      const { id_usuario, id_video, segundos_vistos, completado, ultima_visualizacion } = req.body;

      if (!id_usuario || !id_video) {
        return res.status(400).json({ 
          success: false,
          error: 'El id_usuario y id_video son obligatorios' 
        });
      }

      const video = await VideoModel.buscarPorId(id_video);
      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'El video no existe'
        });
      }

      const duracionVideo = video.duracion_segundos || video.duracion;
      console.log(`Video ${id_video}: duración = ${duracionVideo} segundos`);

      const progresoExistente = await ProgresoVideoModel.buscarPorUsuarioYVideo(id_usuario, id_video);

      let segundosFinal = segundos_vistos || 0;
      let completadoFinal = 0;

      if (progresoExistente) {
        segundosFinal = segundos_vistos || progresoExistente.segundos_vistos;
        completadoFinal = progresoExistente.completado;
      }

      const umbralCompletado = Math.max(duracionVideo - 2, duracionVideo * 0.99);
      
      if (segundosFinal >= umbralCompletado) {
        completadoFinal = 1;
        console.log(`Video marcado como completado: ${segundosFinal}s >= ${umbralCompletado}s (hasta el final de ${duracionVideo}s)`);
      }

      segundosFinal = Math.min(segundosFinal, duracionVideo);

      if (progresoExistente) {
        const datosActualizados = {
          id_usuario,
          id_video,
          segundos_vistos: segundosFinal,
          completado: completadoFinal,
          ultima_visualizacion: ultima_visualizacion || new Date()
        };

        await ProgresoVideoModel.actualizar(progresoExistente.id, datosActualizados);

        return res.json({
          success: true,
          data: {
            id: progresoExistente.id,
            ...datosActualizados
          },
          mensaje: completadoFinal ? 'Video completado correctamente ✅' : 'Progreso de video actualizado correctamente'
        });
      }

      const nuevoProgreso = {
        id_usuario,
        id_video,
        segundos_vistos: segundosFinal,
        completado: completadoFinal,
        ultima_visualizacion: ultima_visualizacion || new Date()
      };

      const resultado = await ProgresoVideoModel.crear(nuevoProgreso);

      res.status(201).json({
        success: true,
        data: {
          id: resultado.insertId,
          ...nuevoProgreso
        },
        mensaje: completadoFinal ? 'Video completado correctamente ✅' : 'Progreso de video creado correctamente'
      });
    } catch (err) {
      console.error('Error al crear progreso:', err);
      res.status(500).json({ 
        success: false,
        error: 'Error al crear el progreso de video' 
      });
    }
  },

  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'ID inválido' 
        });
      }

      const { id_usuario, id_video, segundos_vistos, completado, ultima_visualizacion } = req.body;

      const progresoExistente = await ProgresoVideoModel.buscarPorId(id);
      if (!progresoExistente) {
        return res.status(404).json({ 
          success: false,
          error: 'Progreso no encontrado' 
        });
      }

      const video = await VideoModel.buscarPorId(id_video || progresoExistente.id_video);
      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'El video no existe'
        });
      }

      const duracionVideo = video.duracion_segundos || video.duracion;

      if (progresoExistente.completado === 1) {
        return res.json({
          success: true,
          data: progresoExistente,
          mensaje: 'Video ya completado, no se actualizó el progreso'
        });
      }

      const segundosFinal = typeof segundos_vistos === 'number'
        ? segundos_vistos
        : progresoExistente.segundos_vistos;

      const umbralCompletado = Math.max(duracionVideo - 2, duracionVideo * 0.99);
      
      const completadoFinal = segundosFinal >= umbralCompletado ? 1 : 0;


      const datosActualizados = {
        id_usuario: id_usuario || progresoExistente.id_usuario,
        id_video: id_video || progresoExistente.id_video,
        segundos_vistos: Math.min(segundosFinal, duracionVideo),
        completado: completadoFinal,
        ultima_visualizacion: ultima_visualizacion || new Date()
      };

      await ProgresoVideoModel.actualizar(id, datosActualizados);

      res.json({
        success: true,
        data: {
          id,
          ...datosActualizados
        },
        mensaje: completadoFinal
          ? 'Video completado correctamente ✅'
          : 'Progreso de video actualizado correctamente'
      });
    } catch (err) {
      console.error('Error al actualizar progreso:', err);
      res.status(500).json({ 
        success: false,
        error: 'Error al actualizar el progreso de video' 
      });
    }
  },


  eliminar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'ID inválido' 
        });
      }

      const progresoExistente = await ProgresoVideoModel.buscarPorId(id);
      if (!progresoExistente) {
        return res.status(404).json({ 
          success: false,
          error: 'Progreso no encontrado' 
        });
      }

      const resultado = await ProgresoVideoModel.eliminar(id);
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'No se pudo eliminar el progreso' 
        });
      }

      res.json({
        success: true,
        mensaje: 'Progreso de video eliminado correctamente',
        data: {
          id,
          eliminado: true,
          affectedRows: resultado.affectedRows
        }
      });
    } catch (err) {
      console.error('Error al eliminar progreso:', err);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar el progreso de video',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

module.exports = progresoController;