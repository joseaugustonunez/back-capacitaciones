const express = require('express');
const router = express.Router();

const ExamenController = require('../controllers/ExamenController');
const PreguntaController = require('../controllers/PreguntaController');
const OpcionController = require('../controllers/OpcionController');
const RespuestaController = require('../controllers/RespuestasController');
const IntentoController = require('../controllers/IntentoController');

// === EXÁMENES ===
router.get('/', ExamenController.listar);
router.get('/:id', ExamenController.obtener);
router.post('/', ExamenController.crear);
router.put('/:id', ExamenController.actualizar);     
router.delete('/:id', ExamenController.eliminar);   

// === PREGUNTAS ===
router.get('/preguntas/examen/:id_examen', PreguntaController.listarPorExamen);
router.post('/preguntas', PreguntaController.crear);

// === OPCIONES ===
router.get('/opciones/pregunta/:id_pregunta', OpcionController.listarPorPregunta);
router.post('/opciones', OpcionController.crear);
router.put('/opciones/:id', OpcionController.actualizar);   
router.delete('/opciones/:id', OpcionController.eliminar);  

// === RESPUESTAS ===
router.get('/respuestas/:id_usuario/:id_examen', RespuestaController.listarPorUsuarioYExamen);
router.post('/respuestas', RespuestaController.registrar);

// === INTENTOS ===
router.get('/intentos/:id_usuario/:id_examen', IntentoController.listarPorUsuarioYExamen);
router.post('/intentos', IntentoController.registrar);

module.exports = router;
