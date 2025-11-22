const express = require('express');
const router = express.Router();
const multer = require('multer');
const VideoController = require('../controllers/VideoController');
const upload = require('../middlewares/uploadMiddleware');

const validarCrearVideo = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: 'El cuerpo de la solicitud está vacío'
    });
  }

  const { id_modulo, titulo } = req.body;

  if (!id_modulo || !titulo) {
    return res.status(400).json({
      success: false,
      message: 'Los campos id_modulo y titulo son obligatorios'
    });
  }

  if (isNaN(parseInt(id_modulo))) {
    return res.status(400).json({
      success: false,
      message: 'id_modulo debe ser un número válido'
    });
  }

  next();
};

const validarId = (req, res, next) => {
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'ID debe ser un número válido'
    });
  }

  next();
};

const validarIdModulo = (req, res, next) => {
  const { id_modulo } = req.params;

  if (isNaN(parseInt(id_modulo))) {
    return res.status(400).json({
      success: false,
      message: 'id_modulo debe ser un número válido'
    });
  }

  next();
};

router.post(
  '/',
  (req, res, next) => {
    const middleware = upload.single('video');
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  validarCrearVideo,
  VideoController.crear
);

router.put(
  '/:id',
  validarId,
  (req, res, next) => {
    const middleware = upload.single('video');
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  (req, res, next) => {
    if (req.body.id_modulo !== undefined && isNaN(Number(req.body.id_modulo))) {
      return res.status(400).json({
        success: false,
        message: 'id_modulo debe ser un número válido'
      });
    }
    next();
  },
  VideoController.actualizar
);
router.get('/', VideoController.listar);
router.get('/modulo/:id_modulo', validarIdModulo, VideoController.listarPorModulo);
router.get('/search/buscar', VideoController.buscar);
router.get('/preview/listar', VideoController.listarVistasPrevia);
router.get('/stats/generales', VideoController.obtenerEstadisticas);
router.get('/stats/modulo/:id_modulo', validarIdModulo, VideoController.obtenerDuracionPorModulo);
router.put('/actions/reordenar', VideoController.reordenar);
router.get('/:id', validarId, VideoController.obtenerPorId);
router.delete('/:id', validarId, VideoController.eliminar);
router.post('/:id/duplicar', validarId, VideoController.duplicar);
router.put('/:id/vista-previa', validarId, VideoController.cambiarVistaPrevia);
router.put('/:id/transcripcion', validarId, VideoController.actualizarTranscripcion);

module.exports = router;
