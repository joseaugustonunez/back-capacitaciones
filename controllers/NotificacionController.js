const NotificacionModel = require('../models/NotificacionModel');

const NotificacionController = {
  crearNotificacion: async (req, res) => {
    try {
      const { id_usuario, titulo, mensaje } = req.body;

      if (!id_usuario || !titulo || !mensaje) {
        return res.status(400).json({ 
          error: "Faltan datos obligatorios: id_usuario, titulo y mensaje son requeridos" 
        });
      }

      const result = await NotificacionModel.crear(req.body);

      res.status(201).json({ 
        mensaje: '✅ Notificación creada correctamente', 
        id: result.insertId 
      });
    } catch (error) {
      console.error("Error en crearNotificacion:", error);
      res.status(500).json({ 
        error: 'Error al crear notificación', 
        detalle: error.message 
      });
    }
  },

  obtenerNotificacionesPorUsuario: async (req, res) => {
    try {
      const { id_usuario } = req.params;
      const notificaciones = await NotificacionModel.listarPorUsuario(id_usuario);

      res.status(200).json({
        mensaje: '📩 Notificaciones obtenidas',
        data: notificaciones
      });
    } catch (error) {
      console.error("Error en obtenerNotificacionesPorUsuario:", error);
      res.status(500).json({
        error: 'Error al obtener notificaciones',
        detalle: error.message
      });
    }
  },

  obtenerNotificacionPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const notificacion = await NotificacionModel.buscarPorId(id);

      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      res.status(200).json({
        mensaje: '📌 Notificación encontrada',
        data: notificacion
      });
    } catch (error) {
      console.error("Error en obtenerNotificacionPorId:", error);
      res.status(500).json({
        error: 'Error al obtener notificación',
        detalle: error.message
      });
    }
  },

  marcarNotificacionComoLeida: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await NotificacionModel.marcarComoLeida(id);

      res.status(200).json({
        mensaje: '📖 Notificación marcada como leída',
        result
      });
    } catch (error) {
      console.error("Error en marcarNotificacionComoLeida:", error);
      res.status(500).json({
        error: 'Error al marcar notificación como leída',
        detalle: error.message
      });
    }
  },

  marcarTodasComoLeidas: async (req, res) => {
    try {
      const { id_usuario } = req.params;
      const result = await NotificacionModel.marcarTodasComoLeidas(id_usuario);

      res.status(200).json({
        mensaje: '📖 Todas las notificaciones marcadas como leídas',
        result
      });
    } catch (error) {
      console.error("Error en marcarTodasComoLeidas:", error);
      res.status(500).json({
        error: 'Error al marcar todas como leídas',
        detalle: error.message
      });
    }
  },

  eliminarNotificacion: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await NotificacionModel.eliminar(id);

      res.status(200).json({
        mensaje: '🗑️ Notificación eliminada',
        result
      });
    } catch (error) {
      console.error("Error en eliminarNotificacion:", error);
      res.status(500).json({
        error: 'Error al eliminar notificación',
        detalle: error.message
      });
    }
  }
};

module.exports = NotificacionController;
