
CREATE DATABASE plataforma_capacitaciones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plataforma_capacitaciones;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dni CHAR(8) UNIQUE NOT NULL, -- DNI de 8 dígitos, único
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    rol ENUM('admin', 'instructor', 'estudiante') DEFAULT 'estudiante',
    url_avatar VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de categorías de cursos
CREATE TABLE categorias_cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cursos
CREATE TABLE cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    descripcion_corta VARCHAR(500),
    id_instructor INT NOT NULL,
    id_categoria INT,
    url_miniatura VARCHAR(500),
    duracion_horas INT DEFAULT 0,
    nivel_dificultad ENUM('principiante', 'intermedio', 'avanzado') DEFAULT 'principiante',
    estado ENUM('borrador', 'publicado', 'archivado') DEFAULT 'borrador',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_instructor) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias_cursos(id) ON DELETE SET NULL
);

-- Tabla de módulos del curso
CREATE TABLE modulos_curso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_curso INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    indice_orden INT NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
    INDEX idx_curso_orden (id_curso, indice_orden)
);

-- Tabla de videos
CREATE TABLE videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_modulo INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    url_video VARCHAR(500) NOT NULL,
    url_miniatura VARCHAR(500),
    duracion_segundos INT DEFAULT 0,
    indice_orden INT NOT NULL,
    es_vista_previa BOOLEAN DEFAULT FALSE,
    transcripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_modulo) REFERENCES modulos_curso(id) ON DELETE CASCADE,
    INDEX idx_modulo_orden (id_modulo, indice_orden)
);

-- Tabla de tipos de contenido interactivo
CREATE TABLE tipos_interaccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de interacción predefinidos
INSERT INTO tipos_interaccion (nombre, descripcion) VALUES
('cuestionario', 'Cuestionario de opción múltiple'),
('completar_espacios', 'Completar espacios en blanco'),
('arrastrar_soltar', 'Arrastrar y soltar elementos'),
('entrada_texto', 'Campo de entrada de texto libre'),
('calificacion', 'Calificación con estrellas o escala'),
('votacion', 'Votación en tiempo real');

-- Tabla de contenido interactivo
CREATE TABLE contenido_interactivo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_video INT NOT NULL,
    id_tipo_interaccion INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tiempo_activacion_segundos INT NOT NULL, -- Momento en el video donde aparece
    configuracion JSON, -- Configuración específica del tipo de interacción
    es_obligatorio BOOLEAN DEFAULT FALSE,
    puntos INT DEFAULT 0, -- Puntos que otorga al completarse
    indice_orden INT DEFAULT 0,
    esta_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_video) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_interaccion) REFERENCES tipos_interaccion(id),
    INDEX idx_video_tiempo (id_video, tiempo_activacion_segundos)
);

-- Tabla de opciones para preguntas de opción múltiple
CREATE TABLE opciones_interaccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_contenido_interactivo INT NOT NULL,
    texto_opcion TEXT NOT NULL,
    es_correcta BOOLEAN DEFAULT FALSE,
    indice_orden INT DEFAULT 0,
    explicacion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_contenido_interactivo) REFERENCES contenido_interactivo(id) ON DELETE CASCADE
);

-- Tabla de inscripciones a cursos
CREATE TABLE inscripciones_cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    porcentaje_progreso DECIMAL(5,2) DEFAULT 0.00,
    estado ENUM('activo', 'completado', 'abandonado', 'suspendido') DEFAULT 'activo',
    puntuacion_final DECIMAL(5,2) DEFAULT NULL,
    url_certificado VARCHAR(500) DEFAULT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
    UNIQUE KEY inscripcion_unica (id_usuario, id_curso)
);

-- Tabla de progreso de videos
CREATE TABLE progreso_videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_video INT NOT NULL,
    segundos_vistos INT DEFAULT 0,
    completado BOOLEAN DEFAULT FALSE,
    ultima_visualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_video) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY usuario_video_unico (id_usuario, id_video)
);

-- Tabla de respuestas a contenido interactivo
CREATE TABLE respuestas_interaccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_contenido_interactivo INT NOT NULL,
    datos_respuesta JSON, -- Almacena la respuesta en formato JSON
    es_correcta BOOLEAN DEFAULT NULL,
    puntos_obtenidos INT DEFAULT 0,
    numero_intento INT DEFAULT 1,
    tiempo_respuesta_segundos INT DEFAULT NULL, -- Tiempo que tardó en responder
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_contenido_interactivo) REFERENCES contenido_interactivo(id) ON DELETE CASCADE,
    INDEX idx_usuario_contenido (id_usuario, id_contenido_interactivo)
);

-- Tabla de comentarios en videos
CREATE TABLE comentarios_videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_video INT NOT NULL,
    id_comentario_padre INT DEFAULT NULL, -- Para respuestas a comentarios
    texto_comentario TEXT NOT NULL,
    marca_tiempo_segundos INT DEFAULT NULL, -- Momento específico del video
    esta_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_video) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_comentario_padre) REFERENCES comentarios_videos(id) ON DELETE CASCADE
);

-- Tabla de calificaciones de cursos
CREATE TABLE calificaciones_cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,
    calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5),
    texto_resena TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
    UNIQUE KEY calificacion_usuario_curso_unica (id_usuario, id_curso)
);

-- Tabla de certificados
CREATE TABLE certificados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,
    codigo_certificado VARCHAR(100) UNIQUE NOT NULL,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP NULL,
    url_pdf VARCHAR(500),
    es_valido BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'exito', 'advertencia', 'error') DEFAULT 'info',
    esta_leida BOOLEAN DEFAULT FALSE,
    tipo_entidad_relacionada VARCHAR(50), -- 'curso', 'video', 'interaccion', etc.
    id_entidad_relacionada INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices adicionales para optimización
CREATE INDEX idx_cursos_estado ON cursos(estado);
CREATE INDEX idx_cursos_instructor ON cursos(id_instructor);
CREATE INDEX idx_inscripciones_usuario ON inscripciones_cursos(id_usuario);
CREATE INDEX idx_inscripciones_estado ON inscripciones_cursos(estado);
CREATE INDEX idx_contenido_interactivo_video ON contenido_interactivo(id_video);
CREATE INDEX idx_respuestas_usuario ON respuestas_interaccion(id_usuario);
CREATE INDEX idx_progreso_video_usuario ON progreso_videos(id_usuario);

-- Vistas útiles para consultas frecuentes

-- Vista de cursos con información del instructor
CREATE VIEW detalles_cursos AS
SELECT 
    c.*,
    u.nombre as nombre_instructor,
    u.apellido as apellido_instructor,
    cat.nombre as nombre_categoria,
    COUNT(DISTINCT mc.id) as total_modulos,
    COUNT(DISTINCT v.id) as total_videos,
    AVG(cc.calificacion) as calificacion_promedio,
    COUNT(DISTINCT ic.id) as total_inscripciones
FROM cursos c
LEFT JOIN usuarios u ON c.id_instructor = u.id
LEFT JOIN categorias_cursos cat ON c.id_categoria = cat.id
LEFT JOIN modulos_curso mc ON c.id = mc.id_curso
LEFT JOIN videos v ON mc.id = v.id_modulo
LEFT JOIN calificaciones_cursos cc ON c.id = cc.id_curso
LEFT JOIN inscripciones_cursos ic ON c.id = ic.id_curso
GROUP BY c.id;

-- Vista de progreso del estudiante
CREATE VIEW progreso_estudiante AS
SELECT 
    ic.id_usuario,
    ic.id_curso,
    c.titulo as titulo_curso,
    ic.porcentaje_progreso,
    ic.estado as estado_inscripcion,
    COUNT(DISTINCT v.id) as total_videos,
    COUNT(DISTINCT pv.id) as videos_vistos,
    COUNT(DISTINCT CASE WHEN pv.completado = TRUE THEN pv.id END) as videos_completados
FROM inscripciones_cursos ic
JOIN cursos c ON ic.id_curso = c.id
JOIN modulos_curso mc ON c.id = mc.id_curso
JOIN videos v ON mc.id = v.id_modulo
LEFT JOIN progreso_videos pv ON v.id = pv.id_video AND pv.id_usuario = ic.id_usuario
GROUP BY ic.id_usuario, ic.id_curso;



-- ================================
-- TABLAS PARA SUBIR ARCHIVOS
-- ================================
CREATE TABLE archivos_modulo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_modulo INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_modulo) REFERENCES modulos_curso(id) ON DELETE CASCADE
);
-- ================================
-- TABLAS PARA EXÁMENES POR MÓDULO
-- ================================

CREATE TABLE IF NOT EXISTS examenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_modulo INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    intentos_permitidos INT DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Preguntas de un examen
CREATE TABLE IF NOT EXISTS preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_examen INT NOT NULL,
    texto TEXT NOT NULL,
    puntaje INT DEFAULT 1
);

-- Opciones de una pregunta
CREATE TABLE IF NOT EXISTS opciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pregunta INT NOT NULL,
    texto TEXT NOT NULL,
    es_correcta BOOLEAN DEFAULT FALSE
);

-- Respuestas de un usuario a un examen
CREATE TABLE IF NOT EXISTS respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_examen INT NOT NULL,
    id_pregunta INT NOT NULL,
    id_opcion INT NOT NULL,
    puntaje_obtenido INT DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unica_respuesta (id_usuario, id_pregunta)
);

-- Intentos de un usuario por examen
CREATE TABLE IF NOT EXISTS intentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_examen INT NOT NULL,
    intento_num INT NOT NULL,
    puntaje_total INT DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unico_intento (id_usuario, id_examen, intento_num)
);
INSERT INTO usuarios (
    dni,
    correo_electronico,
    hash_contrasena,
    nombre,
    apellido,
    rol,
    url_avatar
) VALUES (
    '00000000', -- cambia si lo deseas
    'admin@gmail.com',
    '$2b$12$hoP5dR88tzyi88vT3ZZr2esu.GLZL7.TtWEpWDmoGzP0DRuq5y7iu', -- admin123
    'Admin',
    'Admin',
    'admin',
    NULL
);
INSERT INTO usuarios (
    dni,
    correo_electronico,
    hash_contrasena,
    nombre,
    apellido,
    rol,
    url_avatar
) VALUES (
    '11111111', -- puedes cambiarlo
    'gorehco@gmail.com',
    '$2b$12$hoP5dR88tzyi88vT3ZZr2esu.GLZL7.TtWEpWDmoGzP0DRuq5y7iu', -- admin123
    'Gobierno Regional',
    'Huánuco',
    'instructor',
    NULL
);