const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const CertificadoModel = require("../models/CertififcadoModel");
const UsuarioModel = require("../models/UsuarioModel");
const CursoModel = require("../models/CursoModel");
const NotificacionModel = require("../models/NotificacionModel");
const CertificadoController = {

  _generarPDFFisico: async (usuario, curso, codigo_certificado) => {
    return new Promise((resolve, reject) => {
      try {

        const certificadosDir = path.join(__dirname, "../uploads/certificados");
        if (!fs.existsSync(certificadosDir)) fs.mkdirSync(certificadosDir, { recursive: true });

        const fileName = `${codigo_certificado}.pdf`;
        const filePath = path.join(certificadosDir, fileName);

        const doc = new PDFDocument({ size: "A4", layout: "landscape" });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.image(path.join(__dirname, "../assets/plantilla-certificado1.png"), 0, 0, {
          width: 842,
          height: 595,
        });

        doc.font(path.join(__dirname, "../assets/fonts/GreatVibes-Regular.ttf"))
           .fontSize(48).fillColor("#0b5942")
           .text(`${usuario.nombre} ${usuario.apellido}`, 0, 290, { align: "center", width: 842 });

        doc.font(path.join(__dirname, "../assets/fonts/Poppins-Light.ttf"))
           .fontSize(20).fillColor("#0b5942")
           .text(`Por completar el curso "${curso.titulo}"`, 100, 350, { align: "center", width: 642 });

        doc.fontSize(12).fillColor("#000000")
           .text(`Código: ${codigo_certificado}`, 50, 500);

        doc.fontSize(12).fillColor("#000000")
           .text(`Emitido: ${new Date().toLocaleDateString()}`, 650, 500);

        doc.end();

        stream.on("finish", () => {
          const url_pdf = `/certificados/${fileName}`;
          resolve(url_pdf);
        });

        stream.on("error", (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  },

  _crearCertificado: async (id_usuario, id_curso, fecha_vencimiento) => {
  try {
    const usuario = await UsuarioModel.buscarPorId(id_usuario);
    const curso = await CursoModel.buscarPorId(id_curso);

    if (!usuario) throw new Error('Usuario no encontrado');
    if (!curso) throw new Error('Curso no encontrado');

    const codigo_certificado = generarCodigoCertificado();

    const url_pdf = await CertificadoController._generarPDFFisico(usuario, curso, codigo_certificado);

    await CertificadoModel.crear({
      id_usuario,
      id_curso,
      codigo_certificado,
      fecha_vencimiento,
      url_pdf,
      es_valido: 1,
    });

    return { url_pdf, usuario, curso, codigo_certificado };
  } catch (error) {
    throw error;
  }
},

generar: async (req, res) => {
  try {
    const { id_usuario, id_curso } = req.body;

    const existente = await CertificadoModel.buscarPorUsuarioYCurso(id_usuario, id_curso);
    if (existente) {
      return res.status(200).json({
        message: "⚠️ El certificado ya existía",
        url_pdf: existente.url_pdf,
        codigo: existente.codigo_certificado,
      });
    }

    const fecha_vencimiento = new Date();
    fecha_vencimiento.setFullYear(fecha_vencimiento.getFullYear() + 1);

    const resultado = await CertificadoController._crearCertificado(
      id_usuario, 
      id_curso, 
      fecha_vencimiento
    );

    await NotificacionModel.crear({
      id_usuario,
      titulo: "🎓 Nuevo certificado generado",
      mensaje: `Se generó tu certificado para el curso con código: ${resultado.codigo_certificado}`,
      leido: false,
      fecha: new Date()
    });

    res.status(201).json({
      message: "✅ Certificado generado correctamente",
      url_pdf: resultado.url_pdf,
      codigo: resultado.codigo_certificado,
    });

    setTimeout(async () => {
      await generarCertificadosAutomaticos(id_usuario);
    }, 500);

  } catch (error) {
    console.error("Error al generar certificado:", error);
    res.status(500).json({ error: error.message || "Error al generar el certificado" });
  }
},


  obtenerPorCodigo: async (req, res) => {
    try {
      const { codigo } = req.params;
      const certificado = await CertificadoModel.buscarPorCodigo(codigo);

      if (!certificado) {
        return res.status(404).json({ message: "Certificado no encontrado" });
      }

      res.json(certificado);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener certificado" });
    }
  },
obtenerPorUsuario: async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const certificados = await CertificadoModel.buscarPorUsuario(idUsuario);

    if (!certificados || certificados.length === 0) {
      return res.status(404).json({ message: "No se encontraron certificados para este usuario" });
    }

    res.json(certificados);
  } catch (error) {
    console.error("Error al obtener certificados por usuario:", error);
    res.status(500).json({ error: "Error al obtener certificados del usuario" });
  }
},

  generarAutomaticos: async (idUsuario) => {
    return await generarCertificadosAutomaticos(idUsuario);
  }
};
const generarCodigoCertificado = () => {
  const fecha = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${fecha}-${random}`;
};


const generarCertificadosAutomaticos = async (idUsuario) => {
  try {
    const avances = await CursoModel.getAvanceCursosByUsuario(idUsuario);
    const certificadosGenerados = [];

    for (const curso of avances) {
      if (curso.porcentaje_avance >= 100) {
        const existe = await CertificadoModel.buscarPorUsuarioYCurso(idUsuario, curso.id_curso);

        if (!existe) {
          const fecha_vencimiento = new Date();
          fecha_vencimiento.setFullYear(fecha_vencimiento.getFullYear() + 1);

          try {
            const resultado = await CertificadoController._crearCertificado(
              idUsuario,
              curso.id_curso,
              fecha_vencimiento
            );

            certificadosGenerados.push({
              curso: curso.titulo || curso.curso,
              codigo: resultado.codigo_certificado,
              url: resultado.url_pdf
            });

            console.log(`✅ Certificado generado para usuario ${idUsuario}, curso ${curso.titulo || curso.curso}`);

            await NotificacionModel.crear({
              id_usuario: idUsuario,
              titulo: "🎓 Certificado generado automáticamente",
              mensaje: `Se generó tu certificado del curso "${curso.titulo || curso.curso}"`,
              tipo: "info",
              tipo_entidad_relacionada: "certificado",
              id_entidad_relacionada: resultado.id_certificado || null
            });

          } catch (error) {
            console.error(`❌ Error generando certificado automático para curso ${curso.id_curso}:`, error);
          }
        } else {
          console.log(`⚠️ Usuario ${idUsuario} ya tiene certificado para curso ${curso.id_curso}, no se genera otro.`);
        }
      }
    }

    return certificadosGenerados;
  } catch (error) {
    console.error("❌ Error en generación automática de certificados:", error);
    return [];
  }
};


module.exports = CertificadoController;