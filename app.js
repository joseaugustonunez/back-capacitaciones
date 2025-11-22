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

// ===== CORS ACTUALIZADO =====
app.use(cors({
  origin: [
    'https://capacitacion.sistemasudh.com',  // Frontend en producción
    'http://localhost:5173',                  // Desarrollo local Vite
    'http://localhost:3000'                   // Desarrollo local alternativo
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ============================

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use('/uploads/imagenes', express.static(path.join(__dirname, 'uploads/imagenes')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads/certificados", express.static(path.join(__dirname, "uploads/certificados")));
app.use("/api/certificados", certificadoRoutes);
app.use("/api/comentarios", comentarioRoutes);
app.use("/api/archivos", archivoRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/inscripciones', inscripcionesCursosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/progresos', progresoRoutes)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/notificaciones', notificacionesRouters);
app.use('/api/cursos', cursosRoutes);
app.use('/api/tipos-interaccion', tipoInteraccionRoutes);
app.use('/api/modulos', modulosRouters);
app.use('/api/videos', videosRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/interacciones', interaccionesRoutes);
app.use('/api/examenes', examenesRoutes);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en ${BASE_URL}`);
});