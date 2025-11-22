const ComentarioModel = require('../models/ComentarioModel');

exports.crearComentario = async (req, res) => {
  try {
    const result = await ComentarioModel.crear(req.body);
    res.status(201).json({ mensaje: 'Comentario creado', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear comentario', detalle: error.message });
  }
};

exports.obtenerComentariosPorVideo = async (req, res) => {
  try {
    const { id_video } = req.params;
    const comentarios = await ComentarioModel.listarPorVideo(id_video);
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comentarios', detalle: error.message });
  }
};

exports.actualizarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ComentarioModel.actualizar(id, req.body);
    res.json({ mensaje: 'Comentario actualizado', result });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar comentario', detalle: error.message });
  }
};

exports.eliminarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ComentarioModel.eliminar(id);
    res.json({ mensaje: 'Comentario eliminado', result });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar comentario', detalle: error.message });
  }
};
