const EstadisticasModel = require('../models/EstadisticaModel');

const EstadisticasController = {

  obtenerTotales: async (req, res) => {
    try {
      const totales = await EstadisticasModel.obtenerTotales();
      res.json(totales);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  },

  totalInscritos: async (req, res) => {
    try {
      const { curso } = req.query;

      const resultados = await EstadisticasModel.obtenerInscritosPorCurso({ curso });
      res.status(200).json(resultados);
    } catch (error) {
      console.error('Error al obtener inscritos por curso:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  },

  getMatriculasCertificados: async (req, res) => {
    try {
      const { mes } = req.query;

      const data = await EstadisticasModel.matriculasCertificadosPorMes({ mes });
      res.json(data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProgresoUsuarios: async (req, res) => {
    try {
      const filtros = {
        dni: req.query.dni,
        nombre: req.query.nombre,
        curso: req.query.curso,
        mes: req.query.mes,
        fecha_inicio: req.query.fecha_inicio,
        fecha_fin: req.query.fecha_fin,
        estado: req.query.estado // completo | incompleto
      };

      const progreso = await EstadisticasModel.obtenerProgresoUsuarios(filtros);
      res.json(progreso);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener el progreso de usuarios' });
    }
  },

  obtenerProcesoCurso: async (req, res) => {
    try {
      const filtros = {
        dni: req.query.dni,
        nombre: req.query.nombre,
        curso: req.query.curso,
        mes: req.query.mes,
        fecha_inicio: req.query.fecha_inicio,
        fecha_fin: req.query.fecha_fin,
        estado: req.query.estado
      };

      const resumen = await EstadisticasModel.procesosCusos(filtros);
      res.json(resumen);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el resumen de cursos' });
    }
  }
};

module.exports = EstadisticasController;
