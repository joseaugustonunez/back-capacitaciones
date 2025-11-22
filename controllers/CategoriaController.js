const CategoriaModel = require('../models/CategoriaModel');

const categoriaController = {
  listar: async (req, res) => {
    try {

      const resultados = await CategoriaModel.listar();
      res.json(resultados);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener las categorías' });
    }
  },

  obtener: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const categoria = await CategoriaModel.buscarPorId(id);
      
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json(categoria);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener la categoría' });
    }
  },

  crear: async (req, res) => {
    try {
      const { nombre, descripcion, icono } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const nuevaCategoria = { 
        nombre: nombre.trim(), 
        descripcion: descripcion?.trim(), 
        icono 
      };

      const resultado = await CategoriaModel.crear(nuevaCategoria);

      res.status(201).json({
        id: resultado.insertId,
        ...nuevaCategoria,
        mensaje: 'Categoría creada correctamente'
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al crear la categoría' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { nombre, descripcion, icono } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const categoriaExistente = await CategoriaModel.buscarPorId(id);
      if (!categoriaExistente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      const datosActualizados = { 
        nombre: nombre.trim(), 
        descripcion: descripcion?.trim(), 
        icono 
      };

      await CategoriaModel.actualizar(id, datosActualizados);

      res.json({ 
        id, 
        ...datosActualizados,
        mensaje: 'Categoría actualizada correctamente'
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }


      const categoriaExistente = await CategoriaModel.buscarPorId(id);
      if (!categoriaExistente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }


      const resultado = await CategoriaModel.eliminar(id);
      


      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'No se pudo eliminar la categoría' });
      }


      
      res.json({ 
        mensaje: 'Categoría eliminada correctamente',
        id: id,
        nombre: categoriaExistente.nombre,
        eliminada: true,
        affectedRows: resultado.affectedRows,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      res.status(500).json({ 
        error: 'Error al eliminar la categoría',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

module.exports = categoriaController;