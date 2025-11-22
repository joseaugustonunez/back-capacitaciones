const express = require('express');
const router = express.Router();
const multer = require("multer");
const cursoController = require('../controllers/CursoController');
const uploadImagen = require('../middlewares/uploadImagen');

router.post('/', uploadImagen.single('imagen'), cursoController.crear);
router.get('/publicados', cursoController.listarPublicados);
router.get('/', cursoController.listar);                    
router.get('/:id', cursoController.obtener);              
router.put('/:id', uploadImagen.single('imagen'), cursoController.actualizar);
router.delete('/:id', cursoController.eliminar);          
router.get("/usuarios/:idUsuario/cursos/avance",  cursoController.obtenerAvanceCursos);

router.patch('/:id/estado', cursoController.cambiarEstado); 
router.get('/instructor/:id', cursoController.porInstructor);
router.get('/categoria/:id', cursoController.porCategoria);  
router.get('/admin/estadisticas', cursoController.estadisticas); 
router.get("/:id/modulos", cursoController.obtenerConModulos);
module.exports = router;