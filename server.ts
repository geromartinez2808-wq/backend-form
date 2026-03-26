import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";
import dns from "dns";

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
      // Leemos TODOS los campos que manda el OnboardingForm.tsx
      const { nombre, empresa, email, actividad, metodoAdmin, problema, mejora } = req.body;
      
      const mailOptions: any = {
        from: '"Sistema Diagnóstico" <geronimoadm241@gmail.com>',
        to: 'geronimoadm241@gmail.com', 
        subject: `NUEVO: ${nombre} - ${empresa}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2>Datos del Formulario</h2>
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Empresa:</strong> ${empresa}</p>
            <p><strong>Email:</strong> ${email}</p>
            <hr>
            <p><strong>Actividad:</strong> ${actividad}</p>
            <p><strong>Método Actual:</strong> ${metodoAdmin}</p>
            <p><strong>Problemas:</strong> ${problema}</p>
            <p><strong>Objetivo:</strong> ${mejora}</p>
            <hr>
            <p>Archivo adjunto incluido abajo.</p>
          </div>
        `,
        attachments: []
      };

      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
      }

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor en puerto ${PORT}`));
}

startServer();