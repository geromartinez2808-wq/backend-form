import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Recibimos el archivo en memoria temporal
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // MOTOR DE ENVÍO (Cuenta empresa)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD 
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("📩 Nuevo diagnóstico recibido de:", req.body.nombre);

      const mailOptions: any = {
        from: '"Sistema de Diagnósticos" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com', // Te llega a vos mismo
        subject: `NUEVO FORMULARIO: ${req.body.nombre}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Datos del Cliente</h2>
            <p><strong>Nombre:</strong> ${req.body.nombre}</p>
            <p><strong>Empresa:</strong> ${req.body.empresa}</p>
            <p><strong>Email:</strong> ${req.body.email}</p>
            <p><strong>Problema:</strong> ${req.body.problema}</p>
            <p><strong>Mejora:</strong> ${req.body.mejora}</p>
            <hr>
            <p style="color: #666;"><i>El archivo adjunto se encuentra abajo.</i></p>
          </div>
        `,
        attachments: []
      };

      // Si hay archivo, lo pegamos al mail
      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
        console.log("📎 Archivo adjuntado correctamente.");
      }

      await transporter.sendMail(mailOptions);
      console.log("✅ Mail con adjunto enviado con éxito.");

      res.status(200).json({ success: true, message: "Enviado correctamente" });

    } catch (error: any) {
      console.error("❌ ERROR:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor de correos activo`));
}

startServer();