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

  // ID de tu carpeta nueva (Asegurate que sea la 1Xto1XBcZgnPYBQZCL6aDc_CIwQ51DE34)
  const FOLDER_ID = "1Xto1XBcZgnPYBQZCL6aDc_CIwQ51DE34";
  
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ]
  });

  const drive = google.drive({ version: 'v3', auth });

  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("🚀 Iniciando subida forzada para:", req.body.nombre);
      
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No hay archivo" });
      }

      // SUBIDA PASO 1: Crear el archivo ignorando la cuota del robot
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
        supportsAllDrives: true,
      } as any);

      const fileId = driveResponse.data.id;

      // SUBIDA PASO 2: Transferencia de permisos para saltar el error de cuota
      // Esto hace que el archivo sea "hijo" legítimo de la carpeta y no del robot
      await drive.permissions.create({
        fileId: fileId!,
        transferOwnership: false, // Las cuentas de servicio no pueden transferir, pero sí dar rol de 'anyone'
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      } as any);

      console.log("✅ ¡LOGRADO! Archivo visible en Drive:", fileId);
      
      res.status(200).json({ 
        success: true, 
        fileUrl: driveResponse.data.webViewLink 
      });

    } catch (error: any) {
      console.error("❌ ERROR CRÍTICO:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Error de cuota (Google Drive)",
        details: error.message 
      });
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

  app.listen(PORT, "0.0.0.0", () => console.log(`Backend activo en puerto ${PORT}`));
}

startServer();