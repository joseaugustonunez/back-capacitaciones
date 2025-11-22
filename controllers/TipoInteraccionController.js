const TipoInteraccionModel = require('../models/TipoInteraccionModel');

const TipoInteraccionController = {
  crear: async (req, res) => {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const existe = await TipoInteraccionModel.existePorNombre(nombre);
      if (existe) {
        return res.status(400).json({ error: 'Ya existe un tipo de interacción con ese nombre' });
      }

      const result = await TipoInteraccionModel.crear({ nombre, descripcion });
      res.status(201).json({ id: result.insertId, nombre, descripcion });
    } catch (error) {
      console.error('❌ Error al crear tipo de interacción:', error);
      res.status(500).json({ error: 'Error al crear tipo de interacción' });
    }
  },

  listar: async (req, res) => {
    try {
      const tipos = await TipoInteraccionModel.listar();
      res.json(tipos);
    } catch (error) {
      console.error('❌ Error al listar tipos de interacción:', error);
      res.status(500).json({ error: 'Error al obtener tipos de interacción' });
    }
  },

  buscarPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const tipo = await TipoInteraccionModel.buscarPorId(id);

      if (!tipo) {
        return res.status(404).json({ error: 'Tipo de interacción no encontrado' });
      }

      res.json(tipo);
    } catch (error) {
      console.error('❌ Error al buscar tipo de interacción:', error);
      res.status(500).json({ error: 'Error al obtener tipo de interacción' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      const existe = await TipoInteraccionModel.buscarPorId(id);
      if (!existe) {
        return res.status(404).json({ error: 'Tipo de interacción no encontrado' });
      }

      if (nombre) {
        const duplicado = await TipoInteraccionModel.existePorNombre(nombre, id);
        if (duplicado) {
          return res.status(400).json({ error: 'Ya existe otro tipo de interacción con ese nombre' });
        }
      }

      await TipoInteraccionModel.actualizar(id, { nombre, descripcion });
      res.json({ id, nombre, descripcion });
    } catch (error) {
      console.error('❌ Error al actualizar tipo de interacción:', error);
      res.status(500).json({ error: 'Error al actualizar tipo de interacción' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const existe = await TipoInteraccionModel.buscarPorId(id);

      if (!existe) {
        return res.status(404).json({ error: 'Tipo de interacción no encontrado' });
      }

      await TipoInteraccionModel.eliminar(id);
      res.json({ mensaje: 'Tipo de interacción eliminado correctamente' });
    } catch (error) {
      console.error('❌ Error al eliminar tipo de interacción:', error);
      res.status(500).json({ error: 'Error al eliminar tipo de interacción' });
    }
  }
};

module.exports = TipoInteraccionController;
