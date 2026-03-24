import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Configuramos multer para recibir el archivo en memoria
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // MOTOR DE ENVÍO (geronimoadm241)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD 
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("📩 Recibiendo nuevo diagnóstico de:", req.body.nombre);

      // Preparamos el mail
      const mailOptions: any = {
        from: '"Sistema de Diagnósticos" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com',
        subject: `NUEVO DIAGNÓSTICO: ${req.body.nombre}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #2c3e50;">Datos del Formulario</h2>
            <p><strong>Nombre:</strong> ${req.body.nombre}</p>
            <p><strong>Empresa:</strong> ${req.body.empresa}</p>
            <p><strong>Email:</strong> ${req.body.email}</p>
            <p><strong>Problema:</strong> ${req.body.problema}</p>
            <p><strong>Mejora:</strong> ${req.body.mejora}</p>
            <hr>
            <p><i>El archivo está adjunto a este correo electrónico.</i></p>
          </div>
        `,
        attachments: []
      };

      // Si el cliente subió un archivo, lo adjuntamos al mail
      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
        console.log("📎 Archivo adjuntado al mail con éxito.");
      }

      await transporter.sendMail(mailOptions);
      console.log("✅ Mail enviado correctamente a la empresa.");

      res.status(200).json({ success: true, message: "Enviado con éxito" });

    } catch (error: any) {
      console.error("❌ ERROR AL ENVIAR:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor activo en puerto ${PORT}`));
}

startServer();