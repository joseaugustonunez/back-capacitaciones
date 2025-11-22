const express = require('express');
const router = express.Router();
const TipoInteraccionController = require('../controllers/TipoInteraccionController');

router.post('/', TipoInteraccionController.crear);        
router.get('/', TipoInteraccionController.listar);
router.get('/:id', TipoInteraccionController.buscarPorId);
router.put('/:id', TipoInteraccionController.actualizar);
router.delete('/:id', TipoInteraccionController.eliminar);

module.exports = router;
