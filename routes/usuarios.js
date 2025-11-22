const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const uploadAvatar = require('../middlewares/uploadAvatar');

router.post('/registro', UsuarioController.registrar);
router.post('/login',  UsuarioController.login);
router.get('/instructores', UsuarioController.listarInstructores);
router.put("/:id/contrasena", UsuarioController.cambiarContrasena);
router.post('/resetear-contrasena', UsuarioController.resetearContrasena);
router.post("/solicitar-reset", UsuarioController.solicitarReset);
router.post("/resetear-con-token", UsuarioController.resetearConToken);
router.put('/avatar/:id', uploadAvatar.single('avatar'), UsuarioController.subirAvatar);
router.get('/:id/estadisticas', UsuarioController.obtenerEstadisticasUsuario);
module.exports = router;
