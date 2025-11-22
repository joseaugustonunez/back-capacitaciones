const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/ProgresoController');

router.get('/', progresoController.listar);
router.get('/usuario/:userId/video/:videoId', progresoController.obtenerPorUsuarioYVideo);
router.get('/usuario/:userId', progresoController.obtenerPorUsuario);
router.get('/:id', progresoController.obtener);
router.post('/', progresoController.crear);
router.put('/:id', progresoController.actualizar);
router.delete('/:id', progresoController.eliminar);

module.exports = router;