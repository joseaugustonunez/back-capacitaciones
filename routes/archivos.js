const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage });

const archivoController = require('../controllers/ArchivoController');

router.get('/', archivoController.listar);
router.get('/modulo/:id_modulo', archivoController.listarPorModulo);
router.get('/:id', archivoController.obtener);
router.post('/', upload.single('archivo'), archivoController.crear);
router.put('/:id', upload.single('archivo'), archivoController.actualizar);
router.delete('/:id', archivoController.eliminar);

module.exports = router;
