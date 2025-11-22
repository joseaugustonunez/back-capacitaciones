const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/NotificacionController');

router.post('/', notificacionController.crearNotificacion);
router.get('/usuario/:id_usuario', notificacionController.obtenerNotificacionesPorUsuario);
router.get('/:id', notificacionController.obtenerNotificacionPorId);
router.put('/leer/:id', notificacionController.marcarNotificacionComoLeida);
router.put('/leer-todas/:id_usuario', notificacionController.marcarTodasComoLeidas);
router.delete('/:id', notificacionController.eliminarNotificacion);

module.exports = router;
