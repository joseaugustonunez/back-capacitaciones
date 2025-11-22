const OpcionModel = require('../models/OpcionModel');

const OpcionController = {
  listarPorPregunta: async (req, res) => {
    try {
      const id_pregunta = parseInt(req.params.id_pregunta);
      if (isNaN(id_pregunta)) return res.status(400).json({ error: 'ID inválido' });

      const opciones = await OpcionModel.listarPorPregunta(id_pregunta);
      res.json(opciones);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener opciones' });
    }
  },

  crear: async (req, res) => {
    try {
      const { id_pregunta, texto, es_correcta } = req.body;
      if (!id_pregunta || !texto) return res.status(400).json({ error: 'id_pregunta y texto son obligatorios' });

      const result = await OpcionModel.crear({ id_pregunta, texto, es_correcta });
      res.status(201).json({ id: result.insertId, id_pregunta, texto, es_correcta: !!es_correcta });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear opción' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const { texto, es_correcta } = req.body;
      if (typeof texto === 'undefined') return res.status(400).json({ error: 'texto es obligatorio' });

      await OpcionModel.actualizar(id, { texto, es_correcta });
      const opcion = await OpcionModel.buscarPorId(id);
      res.json(opcion);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar opción' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      await OpcionModel.eliminar(id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar opción' });
    }
  },
};

module.exports = OpcionController;
