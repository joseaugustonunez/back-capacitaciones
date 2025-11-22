const express = require('express');
const router = express.Router();
const ModuloCursoController = require('../controllers/ModuloController');

router.use((req, res, next) => {
  next();
});
router.get("/usuarios/:id/avance-cursos", ModuloCursoController.getAvancePorUsuario);
router.get('/', ModuloCursoController.listar);
router.get('/:id/videos', ModuloCursoController.obtenerVideosPorModulo);
router.post('/', ModuloCursoController.crear);
router.get('/:id', ModuloCursoController.obtenerPorId);
router.put('/:id', ModuloCursoController.actualizar);
router.delete('/:id', ModuloCursoController.eliminar);
router.delete('/:id/fisico', ModuloCursoController.eliminarFisico);
router.put('/reordenar', ModuloCursoController.reordenar);
router.patch('/:id/estado', ModuloCursoController.cambiarEstado);
router.post('/:id/duplicar', ModuloCursoController.duplicar);
router.get('/curso/:id_curso/estadisticas', ModuloCursoController.estadisticas);
router.get('/curso/:idCurso', ModuloCursoController.listarPorCurso);
router.get('/activos', (req, res) => {
  req.query.estado = 'true';
  ModuloCursoController.listar(req, res);
});
router.get('/inactivos', (req, res) => {
  req.query.estado = 'false';
  ModuloCursoController.listar(req, res);
});
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de módulos:', error);
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Referencia inválida - El curso especificado no existe',
      codigo: 'FOREIGN_KEY_ERROR'
    });
  }
  
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Ya existe un módulo con estos datos',
      codigo: 'DUPLICATE_ENTRY'
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor en módulos',
    detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;