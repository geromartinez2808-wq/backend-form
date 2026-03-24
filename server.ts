import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";
import dns from "dns";

// TRUCO MAESTRO: Forzamos a que el servidor use IPv4 para evitar el error de Render
dns.setDefaultResultOrder("ipv4first");

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD 
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("📩 Recibiendo:", req.body.nombre);

      const mailOptions: any = {
        from: '"Sistema Diagnóstico" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com', 
        subject: `NUEVO: ${req.body.nombre}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2>Datos del Formulario</h2>
            <p><strong>Nombre:</strong> ${req.body.nombre}</p>
            <p><strong>Problema:</strong> ${req.body.problema}</p>
            <hr>
            <p>Archivo adjunto incluido.</p>
          </div>
        `,
        attachments: []
      };

      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
        console.log("📎 Archivo cargado.");
      }

      console.log("⏳ Intentando envío (Modo IPv4 Forzado)...");
      await transporter.sendMail(mailOptions);
      console.log("✅ ¡ÉXITO TOTAL!");

      res.status(200).json({ success: true });

    } catch (error: any) {
      console.error("❌ ERROR FINAL:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor en puerto ${PORT}`));
}

startServer();