const express = require('express');
const router = express.Router();
const InteraccionController = require('../controllers/InteraccionController');

const validateNumericParams = (params) => {
  return (req, res, next) => {
    for (const param of params) {
      const value = req.params[param];
      if (value && isNaN(parseInt(value))) {
        return res.status(400).json({
          success: false,
          message: `El parámetro ${param} debe ser un número válido`
        });
      }
    }
    next();
  };
};

router.get('/video/:idVideo', InteraccionController.obtenerInteraccionesPorVideo);
router.get('/video/:idVideo/estadisticas', InteraccionController.obtenerEstadisticas);
router.post('/', InteraccionController.crearInteraccion);
router.delete('/:id', InteraccionController.eliminar);
router.post('/responder', InteraccionController.procesarRespuesta);
router.get('/progreso/:id_usuario/:id_video', validateNumericParams(['id_usuario', 'id_video']),InteraccionController.obtenerProgresoUsuario);
router.get('/verificar-progreso', InteraccionController.verificarProgreso);
router.get('/estadisticas/:id_interaccion',validateNumericParams(['id_interaccion']),InteraccionController.obtenerEstadisticasInteraccion);
router.get('/:id',
  validateNumericParams(['id']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const ContenidoInteractivo = require('../models/ContenidoModel');
      const interaccion = await ContenidoInteractivo.obtenerPorId(id);
      
      if (!interaccion) {
        return res.status(404).json({
          success: false,
          message: 'Interacción no encontrada'
        });
      }

      res.json({
        success: true,
        data: interaccion
      });
    } catch (error) {
      console.error('Error al obtener interacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener interacción',
        error: error.message
      });
    }
  }
);

router.put("/:id", InteraccionController.actualizarContenido);
router.delete('/:id', 
  validateNumericParams(['id']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const ContenidoInteractivo = require('../models/ContenidoModel');
      const desactivado = await ContenidoInteractivo.desactivar(id);
      
      if (!desactivado) {
        return res.status(404).json({
          success: false,
          message: 'Interacción no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Interacción desactivada correctamente'
      });
    } catch (error) {
      console.error('Error al desactivar interacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar interacción',
        error: error.message
      });
    }
  }
);
router.post('/reiniciar-progreso',
  async (req, res) => {
    try {
      const { id_usuario, id_video } = req.body;
      
      if (!id_usuario || !id_video) {
        return res.status(400).json({
          success: false,
          message: 'id_usuario e id_video son obligatorios'
        });
      }

      const { executeQuery } = require('../config/database');
      const deleteQuery = `
        DELETE ri FROM respuestas_interaccion ri
        INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
        WHERE ri.id_usuario = ? AND ci.id_video = ?
      `;
      
      await executeQuery(deleteQuery, [id_usuario, id_video]);

      res.json({
        success: true,
        message: 'Progreso del usuario reiniciado correctamente'
      });
    } catch (error) {
      console.error('Error al reiniciar progreso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reiniciar progreso',
        error: error.message
      });
    }
  }
);

// Obtener estadísticas generales de un video
router.get('/estadisticas-video/:id_video',
  validateNumericParams(['id_video']),
  async (req, res) => {
    try {
      const { id_video } = req.params;
      
      const { executeQuery } = require('../config/database');
      
      const query = `
        SELECT 
          COUNT(ci.id) as total_interacciones,
          SUM(CASE WHEN ci.esta_activo = 1 THEN 1 ELSE 0 END) as activas,
          SUM(CASE WHEN ci.es_obligatorio = 1 THEN 1 ELSE 0 END) as obligatorias,
          SUM(ci.puntos) as puntos_totales,
          AVG(ci.puntos) as puntos_promedio,
          COUNT(DISTINCT ri.id_usuario) as usuarios_participantes,
          COUNT(ri.id) as total_respuestas,
          SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas
        FROM contenido_interactivo ci
        LEFT JOIN respuestas_interaccion ri ON ci.id = ri.id_contenido_interactivo
        WHERE ci.id_video = ?
        GROUP BY ci.id_video
      `;

      const estadisticas = await executeQuery(query, [id_video]);

      res.json({
        success: true,
        data: estadisticas[0] || {
          total_interacciones: 0,
          activas: 0,
          obligatorias: 0,
          puntos_totales: 0,
          puntos_promedio: 0,
          usuarios_participantes: 0,
          total_respuestas: 0,
          respuestas_correctas: 0
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas del video:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del video',
        error: error.message
      });
    }
  }
);

// Obtener ranking de usuarios por puntuación en un video
router.get('/ranking/:id_video',
  validateNumericParams(['id_video']),
  async (req, res) => {
    try {
      const { id_video } = req.params;
      const limite = parseInt(req.query.limite) || 10;
      
      const { executeQuery } = require('../config/database');
      
      const query = `
        SELECT 
          ri.id_usuario,
          u.nombre_usuario,
          u.email,
          SUM(ri.puntos_obtenidos) as puntos_totales,
          COUNT(ri.id) as total_respuestas,
          SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas,
          ROUND((SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) / COUNT(ri.id)) * 100, 2) as porcentaje_aciertos
        FROM respuestas_interaccion ri
        INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
        LEFT JOIN usuarios u ON ri.id_usuario = u.id
        WHERE ci.id_video = ?
        GROUP BY ri.id_usuario
        ORDER BY puntos_totales DESC, porcentaje_aciertos DESC
        LIMIT ?
      `;

      const ranking = await executeQuery(query, [id_video, limite]);

      res.json({
        success: true,
        data: ranking
      });
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ranking',
        error: error.message
      });
    }
  }
);

// Exportar datos de interacciones de un video
router.get('/exportar/:id_video',
  validateNumericParams(['id_video']),
  async (req, res) => {
    try {
      const { id_video } = req.params;
      const formato = req.query.formato || 'json';
      
      const { executeQuery } = require('../config/database');
      
      const query = `
        SELECT 
          ci.id as interaccion_id,
          ci.titulo,
          ci.descripcion,
          ci.tiempo_activacion_segundos,
          ti.nombre as tipo_interaccion,
          ci.puntos,
          ci.es_obligatorio,
          ci.esta_activo,
          COUNT(ri.id) as total_respuestas,
          SUM(CASE WHEN ri.es_correcta = 1 THEN 1 ELSE 0 END) as respuestas_correctas,
          AVG(ri.tiempo_respuesta_segundos) as tiempo_promedio_respuesta
        FROM contenido_interactivo ci
        INNER JOIN tipos_interaccion ti ON ci.id_tipo_interaccion = ti.id
        LEFT JOIN respuestas_interaccion ri ON ci.id = ri.id_contenido_interactivo
        WHERE ci.id_video = ?
        GROUP BY ci.id
        ORDER BY ci.tiempo_activacion_segundos ASC
      `;

      const datos = await executeQuery(query, [id_video]);

      if (formato === 'csv') {
        const csv = convertToCSV(datos);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="interacciones_video_${id_video}.csv"`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: datos,
          formato: 'json'
        });
      }
    } catch (error) {
      console.error('Error al exportar datos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar datos',
        error: error.message
      });
    }
  }
);

// Clonar interacciones de un video a otro
router.post('/clonar',
  async (req, res) => {
    try {
      const { id_video_origen, id_video_destino } = req.body;
      
      if (!id_video_origen || !id_video_destino) {
        return res.status(400).json({
          success: false,
          message: 'id_video_origen e id_video_destino son obligatorios'
        });
      }

      const { executeQuery } = require('../config/database');
      
      // Obtener interacciones del video origen
      const interaccionesOrigen = await executeQuery(`
        SELECT * FROM contenido_interactivo 
        WHERE id_video = ? AND esta_activo = 1
        ORDER BY tiempo_activacion_segundos ASC
      `, [id_video_origen]);

      if (interaccionesOrigen.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron interacciones en el video origen'
        });
      }

      let interaccionesCreadass = 0;

      for (const interaccion of interaccionesOrigen) {
        // Crear nueva interacción en el video destino
        const insertQuery = `
          INSERT INTO contenido_interactivo 
          (id_video, id_tipo_interaccion, titulo, descripcion, tiempo_activacion_segundos, 
           configuracion, es_obligatorio, puntos, esta_activo, indice_orden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await executeQuery(insertQuery, [
          id_video_destino,
          interaccion.id_tipo_interaccion,
          interaccion.titulo,
          interaccion.descripcion,
          interaccion.tiempo_activacion_segundos,
          interaccion.configuracion,
          interaccion.es_obligatorio,
          interaccion.puntos,
          interaccion.esta_activo,
          interaccion.indice_orden
        ]);
        
        interaccionesCreadass++;
      }

      res.json({
        success: true,
        message: `${interaccionesCreadass} interacciones clonadas exitosamente`,
        data: {
          video_origen: id_video_origen,
          video_destino: id_video_destino,
          interacciones_clonadas: interaccionesCreadass
        }
      });
    } catch (error) {
      console.error('Error al clonar interacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al clonar interacciones',
        error: error.message
      });
    }
  }
);

// Obtener respuestas de un usuario a una interacción específica
router.get('/respuestas/:id_usuario/:id_interaccion',
  validateNumericParams(['id_usuario', 'id_interaccion']),
  async (req, res) => {
    try {
      const { id_usuario, id_interaccion } = req.params;
      
      const { executeQuery } = require('../config/database');
      
      const query = `
        SELECT 
          ri.*,
          ci.titulo as interaccion_titulo,
          ci.puntos as puntos_maximos
        FROM respuestas_interaccion ri
        INNER JOIN contenido_interactivo ci ON ri.id_contenido_interactivo = ci.id
        WHERE ri.id_usuario = ? AND ri.id_contenido_interactivo = ?
        ORDER BY ri.fecha_creacion DESC
      `;

      const respuestas = await executeQuery(query, [id_usuario, id_interaccion]);

      res.json({
        success: true,
        data: respuestas
      });
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener respuestas',
        error: error.message
      });
    }
  }
);

// Función auxiliar para convertir a CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  ).join('\n');
  
  return headers + '\n' + rows;
}

module.exports = router;