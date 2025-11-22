const OpcionInteraccionModel = require('../models/OpcionInteraccionModel');

const OpcionInteraccionController = {
  obtenerPorContenido: async (req, res) => {
    try {
      const { id_contenido_interactivo } = req.params;
      const opciones = await OpcionInteraccionModel.obtenerPorContenido(id_contenido_interactivo);
      res.json(opciones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener opciones' });
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const opcion = await OpcionInteraccionModel.obtenerPorId(id);
      if (!opcion) {
        return res.status(404).json({ error: 'Opción no encontrada' });
      }
      res.json(opcion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la opción' });
    }
  },

  crear: async (req, res) => {
    try {
      const nuevaOpcion = await OpcionInteraccionModel.crear(req.body);
      res.status(201).json(nuevaOpcion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear opción' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const actualizado = await OpcionInteraccionModel.actualizar(id, req.body);
      if (!actualizado) {
        return res.status(404).json({ error: 'Opción no encontrada' });
      }
      res.json({ mensaje: 'Opción actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar opción' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const eliminado = await OpcionInteraccionModel.eliminar(id);
      if (!eliminado) {
        return res.status(404).json({ error: 'Opción no encontrada' });
      }
      res.json({ mensaje: 'Opción eliminada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar opción' });
    }
  }
};

module.exports = OpcionInteraccionController;
