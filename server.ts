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

  // Enable CORS for all origins
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Configure multer for memory storage
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // Google Drive Configuration
  const FOLDER_ID = "1BF6dinP7UqgkR207UuuPy94_mh42ncK_";
  
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const drive = google.drive({ version: 'v3', auth });

  // API routes
  app.post("/upload", upload.single("files"), async (req, res) => {
    try {
      console.log("Received form data:", req.body);
      let fileUrl = null;

      if (req.file) {
        console.log("Received file:", req.file.originalname);
        
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
        });

        fileUrl = driveResponse.data.webViewLink;
        console.log("File uploaded to Drive:", driveResponse.data.id);
      }
      
      res.status(200).json({ 
        success: true,
        message: "Diagnóstico recibido correctamente",
        data: req.body,
        fileUrl: fileUrl
      });
    } catch (error) {
      console.error("Error uploading to Drive:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al procesar el diagnóstico",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
