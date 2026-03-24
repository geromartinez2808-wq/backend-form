import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // CONFIGURACIÓN DE RED COMPATIBLE CON RENDER
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false para puerto 587
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD 
    },
    tls: {
      // Esto obliga a usar IPv4 y evita bloqueos de red
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("📩 Formulario recibido de:", req.body.nombre);

      const mailOptions: any = {
        from: '"Sistema Diagnóstico" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com', 
        subject: `DIAGNÓSTICO: ${req.body.nombre}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Nuevo Diagnóstico</h2>
            <p><strong>Nombre:</strong> ${req.body.nombre}</p>
            <p><strong>Problema:</strong> ${req.body.problema}</p>
            <hr>
            <p>El archivo está adjunto aquí abajo.</p>
          </div>
        `,
        attachments: []
      };

      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
        console.log("📎 Adjunto preparado.");
      }

      console.log("⏳ Conectando con Gmail (Puerto 587)...");
      await transporter.sendMail(mailOptions);
      console.log("✅ ¡MAIL ENVIADO!");

      res.status(200).json({ success: true, message: "Enviado correctamente" });

    } catch (error: any) {
      console.error("❌ ERROR DE ENVÍO:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor activo`));
}

startServer();