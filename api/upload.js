import nodemailer from "nodemailer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error procesando formulario" });
    }

    try {
      console.log("DATOS:", fields);

      // ✅ CREAR CONTENIDO PRIMERO
      const contenido = Object.entries(fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      // 🔍 DEBUG (CLAVE)
      console.log("EMAIL USER:", "geronimomartinez2808@gmail.com");
      console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

      // ✅ CONFIGURAR TRANSPORTER
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "geronimomartinez2808@gmail.com",
          pass: process.env.EMAIL_PASS,
        },
      });

      // ✅ ADJUNTOS
      let attachments = [];

      if (files.files) {
        attachments.push({
          filename: files.files.originalFilename,
          path: files.files.filepath,
        });
      }

      // ✅ ENVIAR MAIL
      await transporter.sendMail({
        from: "Formulario Web",
        to: "geronimoadm241@gmail.com",
        subject: "Nuevo diagnóstico",
        text: contenido,
        attachments,
      });

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error enviando mail" });
    }
  });
}