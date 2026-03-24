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

  // MOTOR DE ENVÍO CORREGIDO (Forzamos IPv4 para evitar ENETUNREACH)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para puerto 465
    auth: {
      user: 'geronimoadm241@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD 
    },
    tls: {
      rejectUnauthorized: false // Esto ayuda a que Render no bloquee la conexión
    }
  });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("📩 Recibiendo datos de:", req.body.nombre);

      const mailOptions: any = {
        from: '"Sistema de Diagnósticos" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com', 
        subject: `NUEVO DIAGNÓSTICO: ${req.body.nombre}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2c3e50;">Nuevo Formulario Recibido</h2>
            <p><strong>Nombre:</strong> ${req.body.nombre}</p>
            <p><strong>Empresa:</strong> ${req.body.empresa}</p>
            <p><strong>Email:</strong> ${req.body.email}</p>
            <p><strong>Problema:</strong> ${req.body.problema}</p>
            <p><strong>Mejora:</strong> ${req.body.mejora}</p>
            <hr>
            <p style="color: #7f8c8d;"><i>El archivo adjunto se encuentra al pie de este correo.</i></p>
          </div>
        `,
        attachments: []
      };

      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
        console.log("📎 Archivo adjuntado.");
      }

      console.log("⏳ Intentando conectar con Gmail...");
      await transporter.sendMail(mailOptions);
      console.log("✅ Mail enviado con éxito!");

      res.status(200).json({ success: true, message: "¡Recibido con éxito!" });

    } catch (error: any) {
      console.error("❌ ERROR EN EL ENVÍO:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor de correos activo en puerto ${PORT}`));
}

startServer();