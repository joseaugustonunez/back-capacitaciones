const ArchivoModel = require('../models/ArchivoModel');
const path = require('path');

const archivoController = {
  listar: async (req, res) => {
    try {
      const resultados = await ArchivoModel.listar();
      res.json(resultados);
    } catch (err) {
      console.error('❌ Error al listar archivos:', err);
      res.status(500).json({ error: 'Error al obtener los archivos' });
    }
  },

  listarPorModulo: async (req, res) => {
    try {
      const id_modulo = parseInt(req.params.id_modulo);
      if (isNaN(id_modulo)) {
        return res.status(400).json({ error: 'ID de módulo inválido' });
      }

      const archivos = await ArchivoModel.listarPorModulo(id_modulo);
      res.json(archivos);
    } catch (err) {
      console.error('❌ Error al listar archivos por módulo:', err);
      res.status(500).json({ error: 'Error al obtener los archivos del módulo' });
    }
  },

  obtener: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const archivo = await ArchivoModel.buscarPorId(id);
      if (!archivo) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      res.json(archivo);
    } catch (err) {
      console.error('❌ Error al obtener archivo:', err);
      res.status(500).json({ error: 'Error al obtener el archivo' });
    }
  },

  crear: async (req, res) => {
    try {
      // si viene archivo subido por multer
      if (req.file) {
        const url_archivo = `/uploads/materials/${req.file.filename}`; // ajustar si sirves distinto
        const archivo = {
          id_modulo: Number(req.body.id_modulo),
          nombre_archivo: req.body.nombre_archivo || req.file.originalname,
          url_archivo,
          descripcion: req.body.descripcion || null
        };
        const result = await ArchivoModel.crear(archivo);
        const creado = await ArchivoModel.buscarPorId(result.insertId);
        return res.status(201).json(creado);
      }

      // si no hay archivo, recibir JSON
      const { id_modulo, nombre_archivo, url_archivo, descripcion } = req.body;
      const archivo = {
        id_modulo: Number(id_modulo),
        nombre_archivo,
        url_archivo: url_archivo || '',
        descripcion: descripcion || null
      };
      const result = await ArchivoModel.crear(archivo);
      const creado = await ArchivoModel.buscarPorId(result.insertId);
      return res.status(201).json(creado);
    } catch (err) {
      console.error('Error crear archivo:', err);
      res.status(500).json({ error: 'Error al crear archivo' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      // obtener registro actual para valores por defecto
      const existente = await ArchivoModel.buscarPorId(id);
      if (!existente) return res.status(404).json({ error: 'Archivo no encontrado' });

      // si viene archivo subido por multer:
      if (req.file) {
        const url_archivo = `/uploads/${req.file.filename}`;
        const archivo = {
          id_modulo: req.body.id_modulo ? Number(req.body.id_modulo) : existente.id_modulo,
          nombre_archivo: req.body.nombre_archivo || req.file.originalname || existente.nombre_archivo,
          url_archivo,
          descripcion: typeof req.body.descripcion !== 'undefined' ? req.body.descripcion : existente.descripcion,
        };

        if (!archivo.id_modulo || !archivo.nombre_archivo) {
          return res.status(400).json({ error: 'id_modulo y nombre_archivo son obligatorios' });
        }

        await ArchivoModel.actualizar(id, archivo);
        const actualizado = await ArchivoModel.buscarPorId(id);
        return res.json(actualizado);
      }

      // si no hay archivo: usar valores del body y conservar url existente si no se envía
      const {
        id_modulo: bodyIdModulo,
        nombre_archivo: bodyNombre,
        url_archivo: bodyUrl,
        descripcion: bodyDesc,
      } = req.body;

      const id_modulo = typeof bodyIdModulo !== 'undefined' ? Number(bodyIdModulo) : existente.id_modulo;
      const nombre_archivo = typeof bodyNombre !== 'undefined' && bodyNombre !== '' ? bodyNombre : existente.nombre_archivo;
      // conservar url existente si no se proporciona nuevo valor (evitar sobreescribir con '')
      const url_archivo = typeof bodyUrl !== 'undefined' && bodyUrl !== '' ? bodyUrl : existente.url_archivo;
      const descripcion = typeof bodyDesc !== 'undefined' ? bodyDesc : existente.descripcion;

      if (!id_modulo || !nombre_archivo) {
        return res.status(400).json({ error: 'id_modulo y nombre_archivo son obligatorios' });
      }

      await ArchivoModel.actualizar(id, {
        id_modulo,
        nombre_archivo,
        url_archivo,
        descripcion,
      });

      const actualizado = await ArchivoModel.buscarPorId(id);
      res.json(actualizado);
    } catch (err) {
      console.error('Error actualizar archivo:', err);
      res.status(500).json({ error: 'Error al actualizar archivo' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const archivoExistente = await ArchivoModel.buscarPorId(id);
      if (!archivoExistente) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      const resultado = await ArchivoModel.eliminar(id);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'No se pudo eliminar el archivo' });
      }

      res.json({
        mensaje: 'Archivo eliminado correctamente',
        id,
        nombre_archivo: archivoExistente.nombre_archivo,
        eliminada: true,
        affectedRows: resultado.affectedRows,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ Error al eliminar archivo:', err);
      res.status(500).json({
        error: 'Error al eliminar el archivo',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

module.exports = archivoController;
