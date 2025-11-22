const RespuestaInteraccionModel = require('../models/RespuestaInteraccionModel');

const RespuestaInteraccionController = {
  obtenerPorContenido: async (req, res) => {
    try {
      const { id_contenido_interactivo } = req.params;
      const respuestas = await RespuestaInteraccionModel.obtenerPorContenido(id_contenido_interactivo);
      res.json(respuestas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener respuestas' });
    }
  },

  obtenerPorUsuario: async (req, res) => {
    try {
      const { id_usuario } = req.params;
      const respuestas = await RespuestaInteraccionModel.obtenerPorUsuario(id_usuario);
      res.json(respuestas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener respuestas' });
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const respuesta = await RespuestaInteraccionModel.obtenerPorId(id);
      if (!respuesta) {
        return res.status(404).json({ error: 'Respuesta no encontrada' });
      }
      res.json(respuesta);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la respuesta' });
    }
  },

crear: async (req, res) => {
  try {
    const { id_usuario, id_contenido_interactivo, es_correcta } = req.body;

    if (!es_correcta) {
      return res.status(200).json({
        mensaje: 'Respuesta incorrecta, no se guardó en la base de datos',
        guardado: false,
      });
    }

    const respuestasExistentes = await RespuestaInteraccionModel.obtenerPorUsuario(id_usuario);
    const yaRespondio = respuestasExistentes.some(
      r => r.id_contenido_interactivo === id_contenido_interactivo
    );

    if (yaRespondio) {
      return res.status(200).json({
        mensaje: 'Ya existe una respuesta correcta para este contenido',
        guardado: false,
      });
    }

    const nuevaRespuesta = await RespuestaInteraccionModel.crear(req.body);
    res.status(201).json({
      mensaje: 'Respuesta correcta guardada',
      guardado: true,
      data: nuevaRespuesta
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear respuesta' });
  }
},


  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const actualizado = await RespuestaInteraccionModel.actualizar(id, req.body);
      if (!actualizado) {
        return res.status(404).json({ error: 'Respuesta no encontrada' });
      }
      res.json({ mensaje: 'Respuesta actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar respuesta' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const eliminado = await RespuestaInteraccionModel.eliminar(id);
      if (!eliminado) {
        return res.status(404).json({ error: 'Respuesta no encontrada' });
      }
      res.json({ mensaje: 'Respuesta eliminada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar respuesta' });
    }
  }
};

module.exports = RespuestaInteraccionController;