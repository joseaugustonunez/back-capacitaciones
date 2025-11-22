const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const storageImagen = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/imagenes');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `imagen-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilterImagen = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no soportado. Use JPG, PNG o WebP.'));
  }
};

const uploadImagen = multer({
  storage: storageImagen,
  fileFilter: fileFilterImagen,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = uploadImagen;
