const ModuloCursoModel = require('../models/ModuloModel');

const ModuloController = {
  getAvancePorUsuario: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ModuloCursoModel.obtenerAvancePorUsuario(id);

      if (!result.success) {
        return res.status(500).json({ success: false, message: result.error });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error en el servidor" });
    }
  },
  obtenerVideosPorModulo: async (req, res) => {
    try {
      const { id } = req.params;
      const videos = await ModuloCursoModel.obtenerVideosPorModulo(id);

      const rows = Array.isArray(videos) ? videos : (videos && videos.data) ? videos.data : [];

      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: "No hay videos para este módulo" });
      }

      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error en el servidor" });
    }
  },
  listar: async (req, res) => {
    try {
      const idCurso = req.query.curso ? parseInt(req.query.curso) : null;

      let modulos;

      if (idCurso) {
        modulos = await ModuloCursoModel.listarPorCurso(idCurso);
      } else {
        modulos = await ModuloCursoModel.listar();
      }

      res.json({
        modulos,
        total: modulos.length
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al obtener los módulos',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },
  listarPorCurso: async (req, res) => {
    try {
      const { idCurso } = req.params;
      const soloActivos = req.query.soloActivos === "false" ? false : true;

      const modulos = await ModuloCursoModel.listarPorCurso(idCurso, soloActivos);

      res.json(modulos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener los módulos" });
    }
  },

  crear: async (req, res) => {
    try {

      const { id_curso, titulo, descripcion, indice_orden, esta_activo } = req.body;

      if (!id_curso || !titulo) {
        return res.status(400).json({
          error: 'Faltan campos requeridos',
          campos_requeridos: ['id_curso', 'titulo']
        });
      }

      const cursoExiste = await ModuloCursoModel.verificarCurso(id_curso);
      if (!cursoExiste) {
        return res.status(400).json({
          error: 'El curso especificado no existe'
        });
      }

      const tituloExiste = await ModuloCursoModel.existeTituloEnCurso(titulo, id_curso);
      if (tituloExiste) {
        return res.status(400).json({
          error: 'Ya existe un módulo con este título en el curso'
        });
      }

      let orden = indice_orden;
      if (!orden) {
        orden = await ModuloCursoModel.obtenerSiguienteOrden(id_curso);
      }

      const moduloData = {
        id_curso,
        titulo,
        descripcion,
        indice_orden: orden,
        esta_activo: esta_activo !== undefined ? esta_activo : true
      };

      const resultado = await ModuloCursoModel.crear(moduloData);

      res.status(201).json({
        mensaje: 'Módulo creado exitosamente',
        id: resultado.insertId,
        modulo: {
          ...moduloData,
          id: resultado.insertId
        }
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al crear el módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de módulo inválido'
        });
      }

      const modulo = await ModuloCursoModel.buscarPorId(parseInt(id));

      if (!modulo) {
        return res.status(404).json({
          error: 'Módulo no encontrado'
        });
      }

      res.json(modulo);
    } catch (err) {
      res.status(500).json({
        error: 'Error al obtener el módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de módulo inválido'
        });
      }

      const moduloExistente = await ModuloCursoModel.buscarPorId(parseInt(id));
      if (!moduloExistente) {
        return res.status(404).json({
          error: 'Módulo no encontrado'
        });
      }

      const { id_curso, titulo, descripcion, indice_orden, esta_activo } = req.body;

      if (!titulo) {
        return res.status(400).json({
          error: 'El título es requerido'
        });
      }

      if (id_curso && id_curso !== moduloExistente.id_curso) {
        const cursoExiste = await ModuloCursoModel.verificarCurso(id_curso);
        if (!cursoExiste) {
          return res.status(400).json({
            error: 'El curso especificado no existe'
          });
        }
      }

      const cursoFinal = id_curso || moduloExistente.id_curso;
      const tituloExiste = await ModuloCursoModel.existeTituloEnCurso(titulo, cursoFinal, parseInt(id));
      if (tituloExiste) {
        return res.status(400).json({
          error: 'Ya existe un módulo con este título en el curso'
        });
      }

      const moduloData = {
        id_curso: cursoFinal,
        titulo,
        descripcion: descripcion !== undefined ? descripcion : moduloExistente.descripcion,
        indice_orden: indice_orden !== undefined ? indice_orden : moduloExistente.indice_orden,
        esta_activo: esta_activo !== undefined ? esta_activo : moduloExistente.esta_activo
      };

      const resultado = await ModuloCursoModel.actualizar(parseInt(id), moduloData);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: 'No se pudo actualizar el módulo'
        });
      }
      res.json({
        mensaje: 'Módulo actualizado exitosamente',
        id: parseInt(id),
        cambios_realizados: resultado.affectedRows
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al actualizar el módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de módulo inválido'
        });
      }

      const moduloExistente = await ModuloCursoModel.buscarPorId(parseInt(id));
      if (!moduloExistente) {
        return res.status(404).json({
          error: 'Módulo no encontrado'
        });
      }

      const resultado = await ModuloCursoModel.eliminar(parseInt(id));

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: 'No se pudo eliminar el módulo'
        });
      }

      res.json({
        mensaje: 'Módulo eliminado exitosamente',
        id: parseInt(id)
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al eliminar el módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  eliminarFisico: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de módulo inválido'
        });
      }

      const resultado = await ModuloCursoModel.eliminarFisico(parseInt(id));

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: 'Módulo no encontrado'
        });
      }

      res.json({
        mensaje: 'Módulo eliminado permanentemente',
        id: parseInt(id)
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al eliminar permanentemente el módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  reordenar: async (req, res) => {
    try {

      const { modulos } = req.body;

      if (!modulos || !Array.isArray(modulos)) {
        return res.status(400).json({
          error: 'Se requiere un array de módulos con id y orden'
        });
      }

      for (const modulo of modulos) {
        if (!modulo.id || modulo.orden === undefined) {
          return res.status(400).json({
            error: 'Cada módulo debe tener id y orden'
          });
        }
      }

      await ModuloCursoModel.reordenar(modulos);

      res.json({
        mensaje: 'Módulos reordenados exitosamente',
        total_reordenados: modulos.length
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al reordenar los módulos',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  cambiarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { esta_activo } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de módulo inválido'
        });
      }

      if (esta_activo === undefined) {
        return res.status(400).json({
          error: 'Se requiere el campo esta_activo'
        });
      }

      const moduloExistente = await ModuloCursoModel.buscarPorId(parseInt(id));
      if (!moduloExistente) {
        return res.status(404).json({
          error: 'Módulo no encontrado'
        });
      }

      const resultado = await ModuloCursoModel.cambiarEstado(parseInt(id), esta_activo);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: 'No se pudo cambiar el estado del módulo'
        });
      }
      res.json({
        mensaje: `Módulo ${esta_activo ? 'activado' : 'desactivado'} exitosamente`,
        id: parseInt(id),
        nuevo_estado: esta_activo
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al cambiar el estado del módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  duplicar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nuevo_titulo } = req.body;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          error: 'ID de módulo inválido'
        });
      }

      const moduloExistente = await ModuloCursoModel.buscarPorId(parseInt(id));
      if (!moduloExistente) {
        return res.status(404).json({
          error: 'Módulo no encontrado'
        });
      }

      const resultado = await ModuloCursoModel.duplicar(parseInt(id), nuevo_titulo);

      res.status(201).json({
        mensaje: 'Módulo duplicado exitosamente',
        modulo_original: parseInt(id),
        modulo_nuevo: resultado.insertId,
        nuevo_orden: resultado.nuevoOrden
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al duplicar el módulo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  estadisticas: async (req, res) => {
    try {
      const { id_curso } = req.params;

      if (!id_curso || isNaN(id_curso)) {
        return res.status(400).json({
          error: 'ID de curso inválido'
        });
      }

      const totalModulos = await ModuloCursoModel.contarPorCurso(parseInt(id_curso), false);
      const modulosActivos = await ModuloCursoModel.contarPorCurso(parseInt(id_curso), true);
      const modulosInactivos = totalModulos - modulosActivos;

      res.json({
        id_curso: parseInt(id_curso),
        total_modulos: totalModulos,
        modulos_activos: modulosActivos,
        modulos_inactivos: modulosInactivos,
        porcentaje_activos: totalModulos > 0 ? Math.round((modulosActivos / totalModulos) * 100) : 0
      });
    } catch (err) {
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

module.exports = ModuloController;