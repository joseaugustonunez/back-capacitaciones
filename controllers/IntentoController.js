const IntentoModel = require('../models/IntentoModel');
const ExamenModel = require('../models/ExamenModel');

const IntentoController = {
  listarPorUsuarioYExamen: async (req, res) => {
    try {
      const id_usuario = parseInt(req.params.id_usuario);
      const id_examen = parseInt(req.params.id_examen);
      if (isNaN(id_usuario) || isNaN(id_examen)) return res.status(400).json({ error: 'ID inválido' });

      const intentos = await IntentoModel.listarPorUsuarioYExamen(id_usuario, id_examen);
      res.json(intentos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener los intentos' });
    }
  },

  registrar: async (req, res) => {
    try {
      const { id_usuario, id_examen, intento_num, puntaje_total } = req.body;

      if (!id_usuario || !id_examen) {
        return res.status(400).json({ error: 'id_usuario y id_examen son obligatorios' });
      }

      // obtener examen para validar intentos permitidos
      const examen = await ExamenModel.buscarPorId(id_examen);
      if (!examen) return res.status(404).json({ error: 'Examen no encontrado' });

      const intentosExistentes = await IntentoModel.listarPorUsuarioYExamen(id_usuario, id_examen);
      const count = Array.isArray(intentosExistentes) ? intentosExistentes.length : 0;

      // calcular intento_num si no viene
      const nuevoIntentoNum = typeof intento_num !== 'undefined' && intento_num !== null ? intento_num : count + 1;

      // validar límites
      if (typeof examen.intentos_permitidos !== 'undefined' && examen.intentos_permitidos !== null) {
        if (examen.intentos_permitidos >= 0 && nuevoIntentoNum > examen.intentos_permitidos) {
          return res.status(400).json({ error: 'No quedan intentos disponibles' });
        }
      }

      const result = await IntentoModel.registrar({ id_usuario, id_examen, intento_num: nuevoIntentoNum, puntaje_total });
      res.status(201).json({ id: result.insertId, id_usuario, id_examen, intento_num: nuevoIntentoNum, puntaje_total });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al registrar el intento' });
    }
  }
};

module.exports = IntentoController;
