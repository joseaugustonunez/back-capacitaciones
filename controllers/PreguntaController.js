const PreguntaModel = require('../models/PreguntaModel');

const PreguntaController = {
  listarPorExamen: async (req, res) => {
    try {
      const id_examen = parseInt(req.params.id_examen);
      if (isNaN(id_examen)) return res.status(400).json({ error: 'ID de examen inválido' });

      const preguntas = await PreguntaModel.listarPorExamen(id_examen);
      res.json(preguntas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener las preguntas' });
    }
  },

  crear: async (req, res) => {
    try {
      const { id_examen, texto, puntaje } = req.body;

      if (!id_examen || !texto) return res.status(400).json({ error: 'id_examen y texto son obligatorios' });

      const result = await PreguntaModel.crear({ id_examen, texto, puntaje });
      res.status(201).json({ id: result.insertId, id_examen, texto, puntaje });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear la pregunta' });
    }
  }
};

module.exports = PreguntaController;
