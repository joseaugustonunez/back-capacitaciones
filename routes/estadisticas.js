const express = require('express');
const router = express.Router();
const EstadisticasController = require('../controllers/EstadisticaController');

router.get('/totales', EstadisticasController.obtenerTotales);
router.get('/inscritos', EstadisticasController.totalInscritos);
router.get('/matriculas-certificados', EstadisticasController.getMatriculasCertificados);
router.get('/progreso-usuarios', EstadisticasController.getProgresoUsuarios);
router.get('/proceso-curso', EstadisticasController.obtenerProcesoCurso);

module.exports = router;
