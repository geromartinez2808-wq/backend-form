import formidable from "formidable";
import { Resend } from "resend";

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
      console.error(err);
      return res.status(500).json({ error: "Error procesando formulario" });
    }

    try {
      console.log("DATOS:", fields);

      const contenido = Object.entries(fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "geronimoadm241@gmail.com",
        subject: "Nuevo diagnóstico",
        text: contenido,
      });

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error enviando mail" });
    }
  });
}