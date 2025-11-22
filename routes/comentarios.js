const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/ComentarioController');

router.post('/', comentarioController.crearComentario);
router.get('/:id_video', comentarioController.obtenerComentariosPorVideo);
router.put('/:id', comentarioController.actualizarComentario);
router.delete('/:id', comentarioController.eliminarComentario);

module.exports = router;
