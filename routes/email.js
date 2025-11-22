const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

router.post("/send", async (req, res) => {
    const { name, email, category, subject, description } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS, 
            },
        });

        const mailOptions = {
            from: `"${name}" <${email}>`, 
            to: "joseaugustonunezvicente@gmail.com", 
            subject: `[${category.toUpperCase()}] ${subject}`,
            text: `
            📩 Nuevo reporte de ayuda

            👤 Nombre: ${name}
            📧 Email: ${email}
            🏷️ Categoría: ${category}
            📝 Asunto: ${subject}

            🖊️ Descripción:
            ${description}
        `,
                    html: `
            <h2>📩 Nuevo reporte de ayuda</h2>
            <p><strong>👤 Nombre:</strong> ${name}</p>
            <p><strong>📧 Email:</strong> ${email}</p>
            <p><strong>🏷️ Categoría:</strong> ${category}</p>
            <p><strong>📝 Asunto:</strong> ${subject}</p>
            <hr/>
            <p><strong>🖊️ Descripción:</strong></p>
            <p>${description}</p>
        `,
        };
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Correo enviado correctamente" });
    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        res.status(500).json({ success: false, message: "Error al enviar correo" });
    }
});

module.exports = router;
