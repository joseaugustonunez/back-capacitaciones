const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/UsuarioModel');
const nodemailer = require("nodemailer");

const UsuarioController = {
registrar: async (req, res) => {
  try {
    const { dni, correo_electronico, contrasena, nombre, apellido, rol, url_avatar } = req.body;

    // Validación de campos obligatorios
    if (!dni || !correo_electronico || !contrasena || !nombre || !apellido) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados' });
    }

    // Verificar si el correo ya existe
    const [existingEmail] = await db.query(
      'SELECT id FROM usuarios WHERE correo_electronico = ?',
      [correo_electronico]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    }

    // Verificar si el DNI ya existe
    const [existingDni] = await db.query(
      'SELECT id FROM usuarios WHERE dni = ?',
      [dni]
    );

    if (existingDni.length > 0) {
      return res.status(409).json({ mensaje: 'El DNI ya está registrado' });
    }

    // Encriptar contraseña
    const hash_contrasena = await bcrypt.hash(contrasena, 10);

    // Insertar nuevo usuario
    const [resultado] = await db.query(
      `INSERT INTO usuarios (dni, correo_electronico, hash_contrasena, nombre, apellido, rol, url_avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dni, correo_electronico, hash_contrasena, nombre, apellido, rol || 'estudiante', url_avatar || null]
    );

    // Respuesta
    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      id: resultado.insertId
    });

  } catch (error) {
    console.error('Error interno:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
},

  login: async (req, res) => {
    const { correo_electronico, contrasena } = req.body;

    try {
      if (!correo_electronico || !contrasena) {
        return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos' });
      }

      const [rows] = await db.query(
        'SELECT * FROM usuarios WHERE correo_electronico = ?',
        [correo_electronico]
      );

      if (rows.length === 0) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const usuario = rows[0];
      const passwordMatch = await bcrypt.compare(contrasena, usuario.hash_contrasena);

      if (!passwordMatch) {
        return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        { id: usuario.id, correo: usuario.correo_electronico, rol: usuario.rol },
        process.env.JWT_SECRET || 'secreto123',
        { expiresIn: '2h' }
      );

      res.json({
        mensaje: 'Inicio de sesión exitoso',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          correo: usuario.correo_electronico,
          rol: usuario.rol,
          url_avatar: usuario.url_avatar,
        },
        token,
      });

    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  listarInstructores: async (req, res) => {
    try {
      const [instructores] = await db.query(
        "SELECT id, nombre, apellido, correo_electronico, url_avatar FROM usuarios WHERE rol = 'instructor'"
      );
      res.json(instructores);
    } catch (error) {
      console.error('Error al obtener instructores:', error);
      res.status(500).json({ error: 'Error al obtener los instructores' });
    }
  },

cambiarContrasena: async (req, res) => {
  try {
    const { id } = req.params;
    const { contrasenaActual, nuevaContrasena } = req.body;

    const usuario = await UsuarioModel.obtenerHashContrasena(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const esValida = await bcrypt.compare(contrasenaActual, usuario.hash_contrasena);
    if (!esValida) {
      return res.status(400).json({ mensaje: "La contraseña actual es incorrecta" });
    }

    const hashNueva = await bcrypt.hash(nuevaContrasena, 10);

    const actualizado = await UsuarioModel.actualizarContrasena(id, hashNueva);

    if (!actualizado) {
      return res.status(500).json({ mensaje: "No se pudo actualizar la contraseña" });
    }

    res.json({ mensaje: "Contraseña actualizada con éxito ✅" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
},
  resetearContrasena: async (req, res) => {
    try {
      const { correo, nuevaContrasena } = req.body;

      if (!correo || !nuevaContrasena) {
        return res.status(400).json({ success: false, message: 'Correo y nueva contraseña son obligatorios' });
      }

      UsuarioModel.buscarPorCorreo(correo, async (error, results) => {
        if (error) {
          console.error('Error al buscar usuario:', error);
          return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }

        if (results.length === 0) {
          return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = results[0];
        const hashNuevaContrasena = await bcrypt.hash(nuevaContrasena, 10);

        UsuarioModel.actualizarContrasena(usuario.id, hashNuevaContrasena, (error) => {
          if (error) {
            console.error('Error al actualizar contraseña:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar la contraseña' });
          }

          res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
        });
      });

    } catch (error) {
      console.error('Error en resetearContrasena:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },
  subirAvatar: async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se subió ninguna imagen.' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const usuario = await UsuarioModel.buscarPorId(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

    if (usuario.url_avatar) {
      const oldAvatarPath = path.join(__dirname, '..', 'uploads', usuario.url_avatar);
      if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
    }

    const actualizado = await UsuarioModel.actualizarAvatar(id, avatarPath);

    if (actualizado) {
      res.json({ mensaje: 'Avatar actualizado correctamente.', url_avatar: avatarPath });
    } else {
      res.status(500).json({ mensaje: 'No se pudo actualizar el avatar.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al subir el avatar.' });
  }
},
obtenerEstadisticasUsuario: async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await UsuarioModel.obtenerEstadisticas(id);

    if (!stats) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
},
 solicitarReset: async (req, res) => {
    try {
      const { correo } = req.body;
      if (!correo) return res.status(400).json({ mensaje: "Correo es requerido" });

      const [rows] = await db.query("SELECT * FROM usuarios WHERE correo_electronico = ?", [correo]);
      if (rows.length === 0) {
        return res.status(404).json({ mensaje: "No existe usuario con este correo" });
      }

      const usuario = rows[0];

      const token = jwt.sign(
        { id: usuario.id, correo: usuario.correo_electronico },
        process.env.JWT_SECRET || "secreto123",
        { expiresIn: "15m" }
      );

      const resetLink = `${process.env.FRONTEND_URL}/restablecer/${token}`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Soporte" <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: "Recuperación de contraseña",
        html: `
          <h2>Hola ${usuario.nombre}</h2>
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace (válido por 15 minutos):</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
        `,
      });

      res.json({ mensaje: "Correo de recuperación enviado ✅" });
    } catch (error) {
      console.error("Error en solicitarReset:", error);
      res.status(500).json({ mensaje: "Error interno del servidor" });
    }
  },

  resetearConToken: async (req, res) => {
    try {
      const { token, nuevaContrasena } = req.body;
      if (!token || !nuevaContrasena) {
        return res.status(400).json({ mensaje: "Token y nueva contraseña requeridos" });
      }

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET || "secreto123");
      } catch (err) {
        return res.status(400).json({ mensaje: "Token inválido o expirado" });
      }

      const hashNueva = await bcrypt.hash(nuevaContrasena, 10);

      await db.query("UPDATE usuarios SET hash_contrasena = ? WHERE id = ?", [
        hashNueva,
        payload.id,
      ]);

      res.json({ mensaje: "Contraseña actualizada con éxito ✅" });
    } catch (error) {
      console.error("Error en resetearConToken:", error);
      res.status(500).json({ mensaje: "Error interno del servidor" });
    }
  },
};

module.exports = UsuarioController;
