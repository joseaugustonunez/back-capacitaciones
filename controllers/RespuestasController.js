const RespuestaModel = require('../models/RespuestaModel');
const IntentoModel = require('../models/IntentoModel');
const ExamenModel = require('../models/ExamenModel');

const RespuestasController = {
  listarPorUsuarioYExamen: async (req, res) => {
    try {
      const id_usuario = parseInt(req.params.id_usuario);
      const id_examen = parseInt(req.params.id_examen);
      if (isNaN(id_usuario) || isNaN(id_examen)) return res.status(400).json({ error: 'ID inválido' });

      const respuestas = await RespuestaModel.listarPorUsuarioYExamen(id_usuario, id_examen);
      res.json(respuestas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener las respuestas' });
    }
  },

  // ahora acepta un solo objeto o un array en `respuestas`
  registrar: async (req, res) => {
    try {
      const { id_usuario, id_examen, id_pregunta, id_opcion, puntaje_obtenido, respuestas } = req.body;

      // Si viene un array de respuestas, hacer inserción en lote
      if (Array.isArray(respuestas) && respuestas.length > 0) {
        if (!id_usuario || !id_examen) {
          return res.status(400).json({ error: 'id_usuario e id_examen son obligatorios para registrar respuestas en lote' });
        }

        // verificar que el examen existe
        const examen = await ExamenModel.buscarPorId(id_examen);
        if (!examen) return res.status(404).json({ error: 'Examen no encontrado' });

        // opcional: verificar intentos si se desea bloqueo por respuestas (no obligatorio aquí)

        const inserted = [];
        for (const r of respuestas) {
          const { id_pregunta: rp, id_opcion: ro, puntaje_obtenido: pobt } = r;
          if (!rp || !ro) continue; // saltar entradas inválidas
          const result = await RespuestaModel.registrar({ id_usuario, id_examen, id_pregunta: rp, id_opcion: ro, puntaje_obtenido: pobt });
          inserted.push({ id: result.insertId, id_pregunta: rp, id_opcion: ro, puntaje_obtenido: pobt || 0 });
        }

        return res.status(201).json({ inserted });
      }

      // caso individual (mantener compatibilidad)
      if (!id_usuario || !id_examen || !id_pregunta || !id_opcion) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      const result = await RespuestaModel.registrar({ id_usuario, id_examen, id_pregunta, id_opcion, puntaje_obtenido });
      res.status(201).json({ id: result.insertId, id_usuario, id_examen, id_pregunta, id_opcion, puntaje_obtenido });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al registrar la respuesta' });
    }
  }
};

module.exports = RespuestasController;
