const express = require("express");
const router = express.Router();
const CertificadoController = require("../controllers/CertificadoController");


router.post("/generar", CertificadoController.generar);
router.get("/codigo/:codigo", CertificadoController.obtenerPorCodigo);
router.get("/usuario/:idUsuario", CertificadoController.obtenerPorUsuario);
module.exports = router;