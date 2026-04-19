// Import warning suppression
require("./suppressWarnings");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ensureDirectories = require("./middleware/ensureDirectories");
const errorLogger = require("./middleware/errorLogger");
const axios = require('axios');

//dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
console.log('OCR Key loaded:', process.env.OCR_SPACE_API_KEY ? 'YES' : 'NO');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(ensureDirectories);
app.use(express.static(__dirname));

const PROJECT_ROOT = path.resolve(__dirname, "..");

let fileCounter = 1;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(
      PROJECT_ROOT,
      process.env.UPLOAD_DIR || "uploads"
    );
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    const ext = path.extname(fileName);
    const basename = path.basename(fileName, ext);

    const finalName = `${basename}${ext}`;
    if (fs.existsSync(path.join(PROJECT_ROOT, "uploads", finalName))) {
      cb(null, `${basename}_${fileCounter++}${ext}`);
    } else {
      cb(null, finalName);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Supported types: PDF, DOCX, XLSX, XLS, JPG, PNG"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
  },
}).single("file");

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal server error",
      code: err.code || "INTERNAL_ERROR",
    },
  });
};

async function safeFileCleanup(filePath) {
  try {
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
    console.log(`Successfully cleaned up file: ${filePath}`);
  } catch (error) {
    if (error.code === "EPERM") {
      console.warn(`File is locked, will be cleaned up later: ${filePath}`);
      setTimeout(async () => {
        try {
          await fs.promises.unlink(filePath);
          console.log(`Delayed cleanup successful: ${filePath}`);
        } catch (err) {
          console.error(`Failed delayed cleanup: ${filePath}`, err);
        }
      }, 1000);
    } else {
      console.warn(`Failed to cleanup file: ${filePath}`, error);
    }
  }
}

// OCR.Space API function
async function recognizeTextWithOCR(imagePath) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey || apiKey === "your_ocr_space_api_key_here") {
    throw new Error("OCR_SPACE_API_KEY is not set. Please update .env with your API key.");
  }

  const FormData = require('form-data');
  const form = new FormData();

  // Read file as buffer (small files <5MB)
  const fileBuffer = fs.readFileSync(imagePath);

  // Determine MIME type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  // Append file with explicit options
  form.append('file', fileBuffer, {
    filename: path.basename(imagePath),
    contentType: mimeType
  });

  // Append other parameters
  form.append('apikey', apiKey);
  form.append('language', 'eng');
  form.append('OCREngine', '2');
  form.append('detectOrientation', 'true');
  form.append('scale', 'true');
  form.append('isOverlayRequired', 'true');
  // form.append('PDFTable', 'true'); // Set to 'true' if you want to extract tables from PDFs

  try {
    const response = await axios.post('https://api.ocr.space/parse/image', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    const result = response.data;

    if (result.IsErroredOnProcessing) {
      const errorMessage = result.ErrorMessage ? result.ErrorMessage.join(', ') : 'Unknown error';
      throw new Error(`OCR processing failed: ${errorMessage}`);
    }

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error('No text extracted from image');
    }

    const parsedText = result.ParsedResults[0].ParsedText;
    const processingTime = result.ProcessingTimeInMilliseconds || 'N/A';

    return {
      text: parsedText,
      confidence: null,
      processingTime: `${processingTime}ms`
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`OCR.space API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Unified test endpoint for all file types
app.post(
  "/api/process",
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: {
            message: err.message,
            code: err.code,
            field: err.field,
          },
        });
      } else if (err) {
        return res.status(500).json({
          error: {
            message: err.message,
            code: "UPLOAD_ERROR",
          },
        });
      }
      next();
    });
  },
  async (req, res) => {
    const filePath = req.file?.path;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const startTime = Date.now();
      const result = await recognizeTextWithOCR(filePath);
      const processingTime = Date.now() - startTime;

      await safeFileCleanup(filePath);

      return res.json({
        success: true,
        data: {
          text: result.text,
          confidence: result.confidence,
          processingTime: result.processingTime,
        },
      });
    } catch (error) {
      console.error("Error processing file:", error);

      if (filePath) {
        await safeFileCleanup(filePath);
      }

      return res.status(500).json({
        success: false,
        error: "Failed to process file",
        details: {
          message: error.message,
          code: error.code || "PROCESSING_ERROR",
        },
      });
    }
  }
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorLogger);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});