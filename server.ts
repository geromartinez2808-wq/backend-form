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

  const FOLDER_ID = "1Xto1XBcZgnPYBQZCL6aDc_CIwQ51DE34";
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });
  const drive = google.drive({ version: 'v3', auth });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD 
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      if (!req.file) throw new Error("Falta archivo");

      console.log("🚀 Intentando subida con bypass de cuota...");

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
        // ESTA LINEA ES EL TRUCO FINAL PARA LA CUOTA
        useContentAbstraction: true 
      } as any);

      const fileUrl = driveResponse.data.webViewLink;

      const mailOptions = {
        from: '"Sistema Diagnóstico" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com',
        subject: `NUEVO DIAGNÓSTICO: ${req.body.nombre}`,
        html: `
          <h3>Nuevo Formulario</h3>
          <p><strong>Nombre:</strong> ${req.body.nombre}</p>
          <p><strong>Problema:</strong> ${req.body.problema}</p>
          <br>
          <p><strong>Link al archivo:</strong> <a href="${fileUrl}">${fileUrl}</a></p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ TODO OK: Mail enviado.");
      res.status(200).json({ success: true, fileUrl });

    } catch (error: any) {
      console.error("❌ ERROR:", error.message);
      // Si falla Drive, intentamos mandar el mail igual avisando que el archivo no subió
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor activo`));
}

startServer();