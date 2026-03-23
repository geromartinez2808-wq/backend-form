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

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  const FOLDER_ID = "1BF6dinP7UqgkR207UuuPy94_mh42ncK_";
  
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("Iniciando subida para:", req.body.nombre);
      let fileUrl = null;

      if (req.file) {
        // Subida con parámetros de compatibilidad total
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
          supportsAllDrives: true, // Para unidades compartidas
          ignoreDefaultVisibility: true // Evita que use la cuota del robot
        } as any);

        fileUrl = driveResponse.data.webViewLink;
        console.log("✅ ÉXITO: Archivo en Drive con ID:", driveResponse.data.id);
      }
      
      res.status(200).json({ success: true, fileUrl });
    } catch (error: any) {
      console.error("❌ ERROR DE GOOGLE:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor en puerto ${PORT}`));
}

startServer();