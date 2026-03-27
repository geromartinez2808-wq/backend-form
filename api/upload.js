import formidable from "formidable";
import { Resend } from "resend";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("FORM ERROR:", err);
      return res.status(500).json({ error: "Error procesando formulario" });
    }

    try {
      console.log("DATOS:", fields);
      console.log("FILES:", files);

      // 📄 Contenido del mail
      const contenido = Object.entries(fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      // 📎 Adjuntos
      let attachments = [];

      if (files && files.files && files.files.length > 0) {
        const file = files.files[0];

        const fileBuffer = fs.readFileSync(file.filepath);

        attachments.push({
          filename: file.originalFilename,
          content: fileBuffer.toString("base64"),
        });
      }

      // 📧 Enviar mail
      const response = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["geronimoadm241@gmail.com"],
        subject: "Nuevo cliente - Diagnóstico",
        text: contenido,
        reply_to: fields.email?.[0] || "geronimoadm241@gmail.com",
        attachments,
      });

      console.log("RESEND RESPONSE:", response);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error("ERROR RESEND:", error);
      return res.status(500).json({ error: "Error enviando mail" });
    }
  });
}