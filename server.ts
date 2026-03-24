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

  // CONFIGURACIÓN DRIVE
  const FOLDER_ID = "1Xto1XBcZgnPYBQZCL6aDc_CIwQ51DE34";
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });
  const drive = google.drive({ version: 'v3', auth });

  // CONFIGURACIÓN EMAIL (Nodemailer)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'geromartinez2808@gmail.com', // El que envía
      pass: process.env.EMAIL_APP_PASSWORD // Contraseña de aplicación
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("Recibiendo datos para:", req.body.nombre);
      let fileUrl = "No se adjuntó archivo";

      if (req.file) {
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
        } as any);
        fileUrl = driveResponse.data.webViewLink!;
      }

      // ENVÍO DE MAIL A LA CUENTA DE DESTINO
      const mailOptions = {
        from: 'Sistema de Diagnósticos <geromartinez2808@gmail.com>',
        to: 'geronimoadm241@gmail.com', // TU CUENTA DE DESTINO
        subject: `Nuevo Diagnóstico: ${req.body.nombre}`,
        html: `
          <h2>Nuevo formulario recibido</h2>
          <p><strong>Nombre:</strong> ${req.body.nombre}</p>
          <p><strong>Empresa:</strong> ${req.body.empresa}</p>
          <p><strong>Email cliente:</strong> ${req.body.email}</p>
          <p><strong>Problema:</strong> ${req.body.problema}</p>
          <p><strong>Mejora solicitada:</strong> ${req.body.mejora}</p>
          <br>
          <p><strong>Archivo en Drive:</strong> <a href="${fileUrl}">${fileUrl}</a></p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Mail enviado a geronimoadm241@gmail.com");

      res.status(200).json({ success: true, fileUrl });
    } catch (error: any) {
      console.error("❌ Error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor en puerto ${PORT}`));
}

startServer();