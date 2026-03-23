import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import { google } from "googleapis";
import { Readable } from "stream";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Habilitar CORS para que Vercel pueda hablar con Render
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // ID de tu carpeta de Google Drive (Donde invitaste al robot como Editor)
  const FOLDER_ID = "1BF6dinP7UqgkR207UuuPy94_mh42ncK_";
  
  // CONFIGURACIÓN DE SEGURIDAD
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    // El .replace asegura que los \n se conviertan en saltos de línea reales
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("Procesando envío de:", req.body.nombre);
      let fileUrl = null;

      if (req.file) {
        console.log("Subiendo archivo:", req.file.originalname);
        
        const fileMetadata = {
          name: `${Date.now()}-${req.file.originalname}`,
          parents: [FOLDER_ID],
        };

        const media = {
          mimeType: req.file.mimetype,
          body: Readable.from(req.file.buffer),
        };

        const driveResponse = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, webViewLink',
          // CONFIGURACIÓN PARA EVITAR ERROR DE CUOTA
          supportsAllDrives: true,
          ignoreDefaultVisibility: true
        } as any);

        fileUrl = driveResponse.data.webViewLink;
        console.log("✅ Archivo subido con éxito. ID:", driveResponse.data.id);
      }
      
      res.status(200).json({ 
        success: true, 
        message: "¡Recibido y guardado en Drive!",
        fileUrl 
      });
    } catch (error: any) {
      console.error("❌ Error en la subida a Drive:", error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Manejo de archivos estáticos para producción en Render
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
}

startServer();