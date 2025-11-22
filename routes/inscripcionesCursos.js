const express = require('express');
const router = express.Router();
const InscripcionCursoController = require('../controllers/InscripcionCursoController');


router.post('/', InscripcionCursoController.crear);
router.get('/', InscripcionCursoController.listar);
router.get('/usuario/:id_usuario/cursos', InscripcionCursoController.listarCursosPorUsuario);
router.get('/:id', InscripcionCursoController.buscarPorId);
router.get('/usuario/:id_usuario', InscripcionCursoController.buscarPorUsuario);
router.put('/:id', InscripcionCursoController.actualizar);
router.delete('/:id', InscripcionCursoController.eliminar);

module.exports = router;
