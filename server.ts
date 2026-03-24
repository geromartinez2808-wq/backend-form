import express from "express";
import multer from "multer";
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

  // CONFIGURACIÓN DRIVE (geronimoadm241)
  const FOLDER_ID = "1Xto1XBcZgnPYBQZCL6aDc_CIwQ51DE34";
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });
  const drive = google.drive({ version: 'v3', auth });

  // MOTOR DE ENVÍO (La cuenta de la empresa envía y recibe)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD // La clave de 16 letras de geronimoadm241
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      if (!req.file) throw new Error("Falta archivo");

      console.log("🚀 Motor Empresa: Procesando...");

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

      // 2. Enviar Mail
      const mailOptions = {
        from: '"Sistema Diagnóstico" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com',
        subject: `NUEVO DIAGNÓSTICO: ${req.body.nombre}`,
        html: `
          <h2>Nuevo formulario recibido</h2>
          <p><strong>Nombre:</strong> ${req.body.nombre}</p>
          <p><strong>Email cliente:</strong> ${req.body.email}</p>
          <p><strong>Problema:</strong> ${req.body.problema}</p>
          <br>
          <p><strong>Archivo en Drive:</strong> <a href="${fileUrl}">${fileUrl}</a></p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Proceso completado con éxito");
      res.status(200).json({ success: true, fileUrl });

    } catch (error: any) {
      console.error("❌ Error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor activo en puerto ${PORT}`));
}

startServer();