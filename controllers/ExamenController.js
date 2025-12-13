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
      const { id_modulo, titulo, intentos_permitidos, puntaje_minimo_aprobacion, es_obligatorio } = req.body;

      if (!id_modulo || !titulo) {
        return res.status(400).json({ error: 'id_modulo y titulo son obligatorios' });
      }

      const puntajeVal = typeof puntaje_minimo_aprobacion !== 'undefined' ? parseFloat(puntaje_minimo_aprobacion) : undefined;
      const esObligatorioVal = typeof es_obligatorio !== 'undefined'
        ? (['1',1,true,'true', 'True'].includes(es_obligatorio) ? 1 : 0)
        : undefined;

      const result = await ExamenModel.crear({
        id_modulo,
        titulo,
        intentos_permitidos,
        puntaje_minimo_aprobacion: typeof puntajeVal !== 'undefined' && !isNaN(puntajeVal) ? puntajeVal : undefined,
        es_obligatorio: typeof esObligatorioVal !== 'undefined' ? esObligatorioVal : undefined,
      });

      res.status(201).json({
        id: result.insertId,
        id_modulo,
        titulo,
        intentos_permitidos,
        puntaje_minimo_aprobacion: typeof puntajeVal !== 'undefined' ? puntajeVal : 0.0,
        es_obligatorio: typeof esObligatorioVal !== 'undefined' ? (esObligatorioVal === 1) : false,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear el examen' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const { titulo, intentos_permitidos, puntaje_minimo_aprobacion, es_obligatorio } = req.body;
      if (!titulo) return res.status(400).json({ error: 'titulo es obligatorio' });

      const puntajeVal = typeof puntaje_minimo_aprobacion !== 'undefined' ? parseFloat(puntaje_minimo_aprobacion) : undefined;
      const esObligatorioVal = typeof es_obligatorio !== 'undefined'
        ? (['1',1,true,'true', 'True'].includes(es_obligatorio) ? 1 : 0)
        : undefined;

      await ExamenModel.actualizar(id, {
        titulo,
        intentos_permitidos,
        puntaje_minimo_aprobacion: typeof puntajeVal !== 'undefined' && !isNaN(puntajeVal) ? puntajeVal : undefined,
        es_obligatorio: typeof esObligatorioVal !== 'undefined' ? esObligatorioVal : undefined,
      });

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
