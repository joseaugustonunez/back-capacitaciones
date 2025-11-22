const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Cargar rutas una por una para encontrar el error
console.log('Cargando archivos de rutas...');

try {
  console.log('1. Cargando usuarios...');
  const usuarioRoutes = require('./routes/usuarios.js');
  console.log('✅ Usuarios cargado');

  console.log('2. Cargando categorias...');
  const categoriasRoutes = require('./routes/categorias.js');
  console.log('✅ Categorias cargado');

  console.log('3. Cargando cursos...');
  const cursosRoutes = require('./routes/cursos.js');
  console.log('✅ Cursos cargado');

  console.log('4. Cargando modulos...');
  const modulosRouters = require('./routes/modulos.js');
  console.log('✅ Modulos cargado');

  console.log('5. Cargando videos...');
  const videosRoutes = require('./routes/videos.js');
  console.log('✅ Videos cargado');

  console.log('6. Cargando progreso...');
  const progresoRoutes = require('./routes/progreso.js');
  console.log('✅ Progreso cargado');

  console.log('7. Cargando certificados...');
  const certificadoRoutes = require('./routes/certificados.js');
  console.log('✅ Certificados cargado');

  console.log('8. Cargando comentarios...');
  const comentarioRoutes = require('./routes/comentarios.js');
  console.log('✅ Comentarios cargado');

  console.log('9. Cargando inscripciones...');
  const inscripcionesCursosRoutes = require('./routes/inscripcionesCursos');
  console.log('✅ Inscripciones cargado');

  console.log('10. Cargando estadisticas...');
  const estadisticasRoutes = require('./routes/estadisticas');
  console.log('✅ Estadisticas cargado');

  console.log('11. Cargando interacciones...');
  const interaccionesRoutes = require('./routes/interacciones.js');
  console.log('✅ Interacciones cargado');

  console.log('12. Cargando notificaciones...');
  const notificacionesRouters = require('./routes/notificaciones.js');
  console.log('✅ Notificaciones cargado');

  console.log('13. Cargando tipoInteraccion...');
  const tipoInteraccionRoutes = require('./routes/tipoInteraccionRoutes.js');
  console.log('✅ TipoInteraccion cargado');

  console.log('14. Cargando email...');
  const emailRoutes = require('./routes/email.js');
  console.log('✅ Email cargado');

  console.log('15. Cargando archivos...');
  const archivoRoutes = require('./routes/archivos.js');
  console.log('✅ Archivos cargado');

  console.log('16. Cargando examenes...');
  const examenesRoutes = require('./routes/examenes.js');
  console.log('✅ Examenes cargado');

  console.log('\n✅ Todos los archivos de rutas cargados exitosamente\n');

  // ===== CONFIGURACIÓN CORS =====
  const allowedOrigins = [
    'https://capacitacion.sistemasudh.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  app.use(cors({
    origin: function(origin, callback) {
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

  app.options('*', cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); 

  // Archivos estáticos
  app.use('/uploads/imagenes', express.static(path.join(__dirname, 'uploads/imagenes')));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use("/uploads/certificados", express.static(path.join(__dirname, "uploads/certificados")));

  // REGISTRAR RUTAS UNA POR UNA
  console.log('Registrando rutas en Express...\n');

  console.log('-> Registrando /api/usuarios');
  app.use("/api/usuarios", usuarioRoutes);
  
  console.log('-> Registrando /api/categorias');
  app.use('/api/categorias', categoriasRoutes);
  
  console.log('-> Registrando /api/cursos');
  app.use('/api/cursos', cursosRoutes);
  
  console.log('-> Registrando /api/modulos');
  app.use('/api/modulos', modulosRouters);
  
  console.log('-> Registrando /api/videos');
  app.use('/api/videos', videosRoutes);
  
  console.log('-> Registrando /api/progresos');
  app.use('/api/progresos', progresoRoutes);
  
  console.log('-> Registrando /api/certificados');
  app.use("/api/certificados", certificadoRoutes);
  
  console.log('-> Registrando /api/comentarios');
  app.use("/api/comentarios", comentarioRoutes);
  
  console.log('-> Registrando /api/inscripciones');
  app.use('/api/inscripciones', inscripcionesCursosRoutes);
  
  console.log('-> Registrando /api/estadisticas');
  app.use('/api/estadisticas', estadisticasRoutes);
  
  console.log('-> Registrando /api/interacciones');
  app.use('/api/interacciones', interaccionesRoutes);
  
  console.log('-> Registrando /api/notificaciones');
  app.use('/api/notificaciones', notificacionesRouters);
  
  console.log('-> Registrando /api/tipos-interaccion');
  app.use('/api/tipos-interaccion', tipoInteraccionRoutes);
  
  console.log('-> Registrando /api/email');
  app.use('/api/email', emailRoutes);
  
  console.log('-> Registrando /api/archivos');
  app.use("/api/archivos", archivoRoutes);
  
  console.log('-> Registrando /api/examenes');
  app.use('/api/examenes', examenesRoutes);

  console.log('\n✅ Todas las rutas registradas exitosamente\n');

  // Manejo de errores
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

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

} catch (error) {
  console.error('\n❌ ERROR:');
  console.error('Mensaje:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

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