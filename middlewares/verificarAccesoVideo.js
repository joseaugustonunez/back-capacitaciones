const VideoModel = require('../models/VideoModel');
const ProgresoModel = require('../models/ProgresoModel');

const verificarAccesoVideo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const videoId = parseInt(req.params.id);

    const video = await VideoModel.buscarPorId(videoId);
    if (!video) return res.status(404).json({ error: "Video no encontrado" });

    const ultimoCompletado = await ProgresoModel.obtenerUltimoCompletadoPorCurso(userId, video.id_curso);

    if (!ultimoCompletado && video.indice_orden !== 1) {
      return res.status(403).json({ error: "Debes empezar por el primer video." });
    }

    if (ultimoCompletado && video.indice_orden > ultimoCompletado.indice_orden + 1) {
      return res.status(403).json({ error: "Completa el video anterior antes de continuar." });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Error verificando acceso a video" });
  }
};

module.exports = verificarAccesoVideo;
