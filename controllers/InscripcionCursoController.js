const InscripcionCursoModel = require('../models/InscripcionCursoModel');

const InscripcionCursoController = {
   listarCursosPorUsuario: async (req, res) => {
    try {
      const id_usuario = req.params.id_usuario || req.query.id_usuario;

      if (!id_usuario) {
        return res.status(400).json({ error: 'Se requiere id_usuario' });
      }

      const cursos = await InscripcionCursoModel.listarCursosConInscripcionPorUsuario(id_usuario);

      return res.json(cursos);
    } catch (error) {
      console.error('Error al listar cursos inscritos:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  crear: async (req, res) => {
  try {
    const { id_usuario, id_curso } = req.body;

    if (!id_usuario || !id_curso) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
    }

    const nuevaInscripcion = await InscripcionCursoModel.crear({
      id_usuario,
      id_curso
    });

    res.status(201).json(nuevaInscripcion);
  } catch (error) {
    console.error('Error al crear inscripción:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
},

  listar: async (req, res) => {
    try {
      const inscripciones = await InscripcionCursoModel.listar();
      res.json(inscripciones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar inscripciones' });
    }
  },

  buscarPorId: async (req, res) => {
    try {
      const inscripcion = await InscripcionCursoModel.buscarPorId(req.params.id);
      if (!inscripcion) {
        return res.status(404).json({ message: 'Inscripción no encontrada' });
      }
      res.json(inscripcion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al buscar inscripción' });
    }
  },

  buscarPorUsuario: async (req, res) => {
    try {
      const inscripciones = await InscripcionCursoModel.buscarPorUsuario(req.params.id_usuario);
      res.json(inscripciones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al buscar inscripciones por usuario' });
    }
  },

  actualizar: async (req, res) => {
    try {
      await InscripcionCursoModel.actualizar(req.params.id, req.body);
      res.json({ message: 'Inscripción actualizada' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar inscripción' });
    }
  },

  eliminar: async (req, res) => {
    try {
      await InscripcionCursoModel.eliminar(req.params.id);
      res.json({ message: 'Inscripción eliminada' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar inscripción' });
    }
  }
};

module.exports = InscripcionCursoController;
