const ExamenModel = require('../models/ExamenModel');

const ExamenController = {
  listar: async (req, res) => {
    try {
      const examenes = await ExamenModel.listar();
      res.json(examenes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener los exámenes' });
    }
  },

  obtener: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const examen = await ExamenModel.buscarPorId(id);
      if (!examen) return res.status(404).json({ error: 'Examen no encontrado' });

      res.json(examen);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener el examen' });
    }
  },

  crear: async (req, res) => {
    try {
      const { id_modulo, titulo, intentos_permitidos } = req.body;

      if (!id_modulo || !titulo) {
        return res.status(400).json({ error: 'id_modulo y titulo son obligatorios' });
      }

      const result = await ExamenModel.crear({ id_modulo, titulo, intentos_permitidos });

      res.status(201).json({ id: result.insertId, id_modulo, titulo, intentos_permitidos });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear el examen' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const { titulo, intentos_permitidos } = req.body;
      if (!titulo) return res.status(400).json({ error: 'titulo es obligatorio' });

      await ExamenModel.actualizar(id, { titulo, intentos_permitidos });

      const examenActualizado = await ExamenModel.buscarPorId(id);
      res.json(examenActualizado);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar el examen' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      await ExamenModel.eliminar(id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar el examen' });
    }
  },
};

module.exports = ExamenController;
