const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const usuarioRoutes = require('./routes/usuarios.js');
const categoriasRoutes = require('./routes/categorias.js');
const cursosRoutes = require('./routes/cursos.js');
const modulosRouters = require('./routes/modulos.js');
const videosRoutes = require('./routes/videos.js');
const progresoRoutes = require('./routes/progreso.js');
const certificadoRoutes = require('./routes/certificados.js');
const comentarioRoutes = require('./routes/comentarios.js');
const inscripcionesCursosRoutes = require('./routes/inscripcionesCursos');
const estadisticasRoutes = require('./routes/estadisticas');
const interaccionesRoutes = require('./routes/interacciones.js');
const notificacionesRouters = require('./routes/notificaciones.js');
const tipoInteraccionRoutes = require('./routes/tipoInteraccionRoutes.js');
const emailRoutes = require('./routes/email.js');
const archivoRoutes = require('./routes/archivos.js');
const examenesRoutes = require('./routes/examenes.js');
require('dotenv').config();

// ===== CONFIGURACIÓN CORS MEJORADA =====
const allowedOrigins = [
  'https://capacitacion.sistemasudh.com',  // Frontend en producción
  'http://localhost:5173',                  // Desarrollo local Vite
  'http://localhost:3000'                   // Desarrollo local alternativo
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir peticiones sin origin (como Postman, apps móviles, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Middleware adicional para manejar preflight manualmente (por si acaso)
app.options('*', cors());

// ============================

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Middleware para logging (útil para debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
  next();
});

// Archivos estáticos
app.use('/uploads/imagenes', express.static(path.join(__dirname, 'uploads/imagenes')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads/certificados", express.static(path.join(__dirname, "uploads/certificados")));

// Rutas API - Comentadas para encontrar el error
// Descomenta de a una para encontrar cuál falla
try {
  console.log('Cargando rutas...');
  
  app.use("/api/usuarios", usuarioRoutes);
  console.log('✅ Usuarios cargado');
  
  app.use('/api/categorias', categoriasRoutes);
  console.log('✅ Categorías cargado');
  
  app.use('/api/cursos', cursosRoutes);
  console.log('✅ Cursos cargado');
  
  app.use('/api/modulos', modulosRouters);
  console.log('✅ Módulos cargado');
  
  app.use('/api/videos', videosRoutes);
  console.log('✅ Videos cargado');
  
  app.use('/api/progresos', progresoRoutes);
  console.log('✅ Progresos cargado');
  
  app.use("/api/certificados", certificadoRoutes);
  console.log('✅ Certificados cargado');
  
  app.use("/api/comentarios", comentarioRoutes);
  console.log('✅ Comentarios cargado');
  
  app.use('/api/inscripciones', inscripcionesCursosRoutes);
  console.log('✅ Inscripciones cargado');
  
  app.use('/api/estadisticas', estadisticasRoutes);
  console.log('✅ Estadísticas cargado');
  
  app.use('/api/interacciones', interaccionesRoutes);
  console.log('✅ Interacciones cargado');
  
  app.use('/api/notificaciones', notificacionesRouters);
  console.log('✅ Notificaciones cargado');
  
  app.use('/api/tipos-interaccion', tipoInteraccionRoutes);
  console.log('✅ Tipos interacción cargado');
  
  app.use('/api/email', emailRoutes);
  console.log('✅ Email cargado');
  
  app.use("/api/archivos", archivoRoutes);
  console.log('✅ Archivos cargado');
  
  app.use('/api/examenes', examenesRoutes);
  console.log('✅ Exámenes cargado');
  
  console.log('✅ Todas las rutas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error al cargar rutas:', error.message);
  console.error('Stack:', error.stack);
}

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ 
    error: err.message || 'Error interno del servidor' 
  });
});

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en ${BASE_URL}`);
  console.log(`✅ CORS habilitado para: ${allowedOrigins.join(', ')}`);
});