import nodemailer from "nodemailer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

form.parse(req, async (err, fields, files) => {
  if (err) {
    console.error(err);
    return res.status(500).json({ error: "Error procesando formulario" });
  }

  try {
    console.log("DATOS:", fields);

    // ✅ 1. CREAR CONTENIDO PRIMERO
    const contenido = Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    // ✅ 2. CONFIGURAR TRANSPORTER
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "geronimomartinez2808@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ 3. ARCHIVO
    let attachments = [];

    if (files.files) {
      attachments.push({
        filename: files.files.originalFilename,
        path: files.files.filepath,
      });
    }

    // ✅ 4. ENVIAR MAIL (AHORA SÍ EXISTE contenido)
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

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error procesando formulario" });
    }

    try {
      console.log("DATOS:", fields);

      const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "geronimomartinez2808@gmail.com",
    pass: process.env.EMAIL_PASS,
  },
});

await transporter.sendMail({
  from: "Formulario Web",
  to: "geronimoadm241@gmail.com",
  subject: "Nuevo diagnóstico",
  text: contenido,
  attachments,
});

      const contenido = Object.entries(fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      let attachments = [];

      if (files.files) {
        attachments.push({
          filename: files.files.originalFilename,
          path: files.files.filepath,
        });
      }

      await transporter.sendMail({
        from: "Formulario Web",
        to: "jeronimoadm241@gmail.com",
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