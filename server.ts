import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import { google } from "googleapis";
import { Readable } from "stream";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // CONFIGURACIÓN DRIVE (Cuenta Empresa)
  const FOLDER_ID = "1Xto1XBcZgnPYBQZCL6aDc_CIwQ51DE34";
  
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  // MOTOR DE ENVÍO (Ahora configurado con la cuenta de la empresa)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'geronimoadm241@gmail.com', // EL MOTOR ES LA EMPRESA
      pass: process.env.EMAIL_APP_PASSWORD // Contraseña de aplicación de geronimoadm241
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      if (!req.file) throw new Error("Archivo adjunto obligatorio.");

      console.log("🚀 Motor Empresa: Subiendo archivo...");

      // 1. Subir a Drive
      const driveResponse = await drive.files.create({
        requestBody: {
          name: `${Date.now()}-${req.file.originalname}`,
          parents: [FOLDER_ID],
        },
        media: {
          mimeType: req.file.mimetype,
          body: Readable.from(req.file.buffer),
        },
        fields: 'id, webViewLink',
        supportsAllDrives: true,
        ignoreDefaultVisibility: true 
      } as any);

      const fileUrl = driveResponse.data.webViewLink;

      // 2. Enviar Mail (De la empresa para la empresa)
      const mailOptions = {
        from: '"Sistema de Diagnósticos" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com', // Te llega a vos mismo a la empresa
        subject: `NUEVO DIAGNÓSTICO: ${req.body.nombre}`,
        html: `
          <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #2c3e50;">Nuevo Formulario Recibido</h2>
            <p><strong>Cliente:</strong> ${req.body.nombre}</p>
            <p><strong>Empresa:</strong> ${req.body.empresa}</p>
            <p><strong>Email:</strong> ${req.body.email}</p>
            <p><strong>Problema:</strong> ${req.body.problema}</p>
            <hr>
            <p style="font-size: 16px;"><strong>📎 VER ADJUNTO:</strong> <a href="${fileUrl}">Abrir en Google Drive</a></p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Éxito total: Archivo en Drive y Mail enviado por la empresa.");

      res.status(200).json({ success: true, fileUrl });

    } catch (error: any) {
      console.error("❌ ERROR:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor activo en puerto ${PORT}`));
}

startServer();