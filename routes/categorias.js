const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/CategoriaController');


router.get('/', categoriaController.listar);
router.get('/:id', categoriaController.obtener);
router.post('/', categoriaController.crear);
router.put('/:id', categoriaController.actualizar);
router.delete('/:id', categoriaController.eliminar);

module.exports = router;
