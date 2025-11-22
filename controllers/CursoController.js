const CursoModel = require("../models/CursoModel");

const cursoController = {
  obtenerAvanceCursos: async (req, res) => {
    try {
      const { idUsuario } = req.params;
      const data = await CursoModel.getAvanceCursosByUsuario(idUsuario);
      if (data.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontraron cursos para este usuario" });
      }
      res.json(data);
    } catch (error) {
      console.error("Error en obtenerAvanceCursos:", error);
      res
        .status(500)
        .json({ message: "Error al obtener el avance de los cursos" });
    }
  },
   obtenerConModulos: async (req, res) => {
    try {
      const { id } = req.params;
      const curso = await CursoModel.buscarConModulos(id);

      if (!curso) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }

      return res.json(curso);
    } catch (error) {
      console.error("❌ Error en obtenerConModulos:", error);
      res.status(500).json({ message: "Error al obtener curso con módulos" });
    }
  },
  listarPublicados: async (req, res) => {
    try {

      const filtros = {};
      if (req.query.categoria) {
        filtros.id_categoria = req.query.categoria;
      }
      if (req.query.busqueda) {
        filtros.busqueda = req.query.busqueda;
      }

     
      const cursos = await CursoModel.listarPublicados(filtros);

     

      res.json(cursos);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener cursos publicados' });
    }
  },
  listar: async (req, res) => {
    try {
      const filtros = {
        estado: req.query.estado,
        id_categoria: req.query.categoria
          ? parseInt(req.query.categoria)
          : null,
        nivel_dificultad: req.query.nivel,
        id_instructor: req.query.instructor
          ? parseInt(req.query.instructor)
          : null,
        titulo: req.query.titulo || null,
      };

      Object.keys(filtros).forEach((key) => {
        if (
          filtros[key] === null ||
          filtros[key] === undefined ||
          filtros[key] === ""
        ) {
          delete filtros[key];
        }
      });

      const cursos = await CursoModel.listar(filtros);

      res.json({
        cursos,
        total: cursos.length,
        filtros_aplicados: filtros,
      });
    } catch (err) {
      res.status(500).json({
        error: "Error al obtener los cursos",
        detalles:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  },

  obtener: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de curso inválido" });
      }

     
      const curso = await CursoModel.buscarPorId(id);

      if (!curso) {
        return res.status(404).json({ error: "Curso no encontrado" });
      }

      res.json(curso);
    } catch (err) {
      
      res.status(500).json({ error: "Error al obtener el curso" });
    }
  },
  crear: async (req, res) => {
    try {
      const {
        titulo,
        descripcion,
        descripcion_corta,
        id_instructor,
        id_categoria,
        duracion_horas,
        nivel_dificultad,
        estado,
      } = req.body;

      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: "El título es obligatorio" });
      }

      if (!id_instructor || isNaN(parseInt(id_instructor))) {
        return res
          .status(400)
          .json({ error: "ID de instructor válido es obligatorio" });
      }

      if (!id_categoria || isNaN(parseInt(id_categoria))) {
        return res
          .status(400)
          .json({ error: "ID de categoría válido es obligatorio" });
      }

      const nivelesValidos = ["principiante", "intermedio", "avanzado"];
      const estadosValidos = ["borrador", "publicado", "archivado"];

      if (nivel_dificultad && !nivelesValidos.includes(nivel_dificultad)) {
        return res.status(400).json({ error: "Nivel de dificultad inválido" });
      }

      if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      let rutaImagen = null;
      if (req.file) {
        rutaImagen = `/uploads/imagenes/${req.file.filename}`;
      }

      const nuevoCurso = {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim(),
        descripcion_corta: descripcion_corta?.trim(),
        id_instructor: parseInt(id_instructor),
        id_categoria: parseInt(id_categoria),
        url_miniatura: rutaImagen,
        duracion_horas: duracion_horas ? parseInt(duracion_horas) : 0,
        nivel_dificultad: nivel_dificultad || "principiante",
        estado: estado || "borrador",
      };

      const resultado = await CursoModel.crear(nuevoCurso);

      res.status(201).json({
        mensaje: "Curso creado correctamente",
        id: resultado.insertId,
        curso: {
          id: resultado.insertId,
          ...nuevoCurso,
        },
      });
    } catch (err) {
      console.error("❌ Error en crear curso:", err);
      res.status(500).json({
        error: "Error al crear el curso",
        detalles:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  },

actualizar: async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de curso inválido" });
    }

    const cursoExistente = await CursoModel.buscarPorId(id);
    if (!cursoExistente) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    const {
      titulo,
      descripcion,
      descripcion_corta,
      id_instructor,
      id_categoria,
      duracion_horas,
      nivel_dificultad,
      estado,
    } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: "El título es obligatorio" });
    }

    if (!id_instructor || isNaN(parseInt(id_instructor))) {
      return res
        .status(400)
        .json({ error: "ID de instructor válido es obligatorio" });
    }

    if (!id_categoria || isNaN(parseInt(id_categoria))) {
      return res
        .status(400)
        .json({ error: "ID de categoría válido es obligatorio" });
    }

    const nivelesValidos = ["principiante", "intermedio", "avanzado"];
    if (nivel_dificultad && !nivelesValidos.includes(nivel_dificultad)) {
      return res.status(400).json({
        error: "Nivel de dificultad inválido",
        opciones_validas: nivelesValidos,
      });
    }

    const estadosValidos = ["borrador", "publicado", "archivado"];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: "Estado inválido",
        opciones_validas: estadosValidos,
      });
    }

    const datosActualizados = {
      titulo: titulo.trim(),
      descripcion: descripcion?.trim(),
      descripcion_corta: descripcion_corta?.trim(),
      id_instructor: parseInt(id_instructor),
      id_categoria: parseInt(id_categoria),
      duracion_horas: duracion_horas
        ? parseInt(duracion_horas)
        : undefined,
      nivel_dificultad: nivel_dificultad || undefined,
      estado: estado || undefined,
    };

    if (req.file) {
      datosActualizados.url_miniatura = `/uploads/imagenes/${req.file.filename}`;
    }
    await CursoModel.actualizar(id, datosActualizados);

    res.json({
      mensaje: "Curso actualizado correctamente",
      id,
      curso: {
        id,
        ...cursoExistente,
        ...datosActualizados,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Error al actualizar el curso",
      detalles:
        process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
},



  eliminar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de curso inválido" });
      }

     

      const cursoExistente = await CursoModel.buscarPorId(id);
      if (!cursoExistente) {

        return res.status(404).json({ error: "Curso no encontrado" });
      }

      

      const resultado = await CursoModel.eliminar(id);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: "No se pudo eliminar el curso" });
      }



      res.json({
        mensaje: "Curso eliminado correctamente",
        id,
        titulo: cursoExistente.titulo,
        eliminado: true,
        affectedRows: resultado.affectedRows,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        error: "Error al eliminar el curso",
        detalles:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  },

  cambiarEstado: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de curso inválido" });
      }

      const { estado } = req.body;
      const estadosValidos = ["borrador", "publicado", "archivado"];

      if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({
          error: "Estado inválido",
          opciones_validas: estadosValidos,
        });
      }

      const cursoExistente = await CursoModel.buscarPorId(id);
      if (!cursoExistente) {
        return res.status(404).json({ error: "Curso no encontrado" });
      }

      await CursoModel.cambiarEstado(id, estado);

      res.json({
        mensaje: `Estado del curso cambiado a: ${estado}`,
        id,
        estado_anterior: cursoExistente.estado,
        estado_nuevo: estado,
      });
    } catch (err) {
      console.error("❌ Error en cambiar estado:", err);
      res.status(500).json({ error: "Error al cambiar el estado del curso" });
    }
  },

  porInstructor: async (req, res) => {
    try {
      const idInstructor = parseInt(req.params.id);
      if (isNaN(idInstructor)) {
        return res.status(400).json({ error: "ID de instructor inválido" });
      }

      const cursos = await CursoModel.buscarPorInstructor(idInstructor);

      res.json({
        instructor_id: idInstructor,
        cursos,
        total: cursos.length,
      });
    } catch (err) {
      console.error("❌ Error en buscar por instructor:", err);
      res.status(500).json({ error: "Error al buscar cursos por instructor" });
    }
  },

  porCategoria: async (req, res) => {
    try {
      const idCategoria = parseInt(req.params.id);
      if (isNaN(idCategoria)) {
        return res.status(400).json({ error: "ID de categoría inválido" });
      }

      const cursos = await CursoModel.buscarPorCategoria(idCategoria);

      res.json({
        categoria_id: idCategoria,
        cursos,
        total: cursos.length,
      });
    } catch (err) {
      console.error("❌ Error en buscar por categoría:", err);
      res.status(500).json({ error: "Error al buscar cursos por categoría" });
    }
  },
  estadisticas: async (req, res) => {
    try {
      const stats = await CursoModel.obtenerEstadisticas();

      res.json({
        estadisticas: {
          ...stats,
          duracion_promedio: parseFloat(stats.duracion_promedio || 0).toFixed(
            1
          ),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ Error en obtener estadísticas:", err);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  },
};

module.exports = cursoController;
