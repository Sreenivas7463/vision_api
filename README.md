# Text Extractor

A modern web application that extracts text from images using OCR.SPACE API. This project provides a clean UI for uploading images and displays the extracted text in real-time.

## Features

- 📷 Image text extraction using OCR.SPACE API
- 🎯 High accuracy text detection and recognition
- 💻 Clean and modern user interface
- ⚡ Real-time text extraction and display
<<<<<<< HEAD
=======

>>>>>>> 245b75f6cd3d4192deb356b5b51194799e500e4b

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Sreenivas7463/vision_api.git
cd Text-Extractor
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
PORT=3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
OCR_SPACE_API_KEY=your_key from OCR.space
```

## Project Structure

```
Text-Extractor/
├── src/
│   ├── server.js           # Main server file
│   ├── test.html          # Frontend UI
│   ├── suppressWarnings.js # Warning suppression utility
│   ├── middleware/
│   │   ├── errorLogger.js      # Error logging middleware
│   │   └── ensureDirectories.js # Directory creation middleware
│   └── utils/             # Utility functions
├── uploads/              # Temporary file storage
├── .env                 # Environment variables
└── README.md            # Project documentation
```

### API Endpoints

#### 1. Process Image

- **URL**: `/api/process`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  file: <image_file>
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "text": "extracted text content",
      "confidence": 0.95
    }
  }
  ```

#### 2. Health Check

- **URL**: `/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

## Running the Application

1. Start the server:

```bash
npm start
```

2. Open `src/test.html` in a web browser or serve it using a static file server.

3. The application will be available at:

- Frontend: `http://localhost:3000/test.html`
- API: `http://localhost:3000/api/process`

## Error Handling

The application includes comprehensive error handling:

- File upload validation
- Image processing errors
- API response validation
- Server-side logging

## Security Considerations

1. File Upload Security:
   - File type validation
   - File size limits
   - Secure file naming
   - Automatic cleanup

2. API Security:
   - CORS configuration
   - Error logging
   - Rate limiting (configurable)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

<<<<<<< HEAD
- https://ocr.space/ free api
=======
- https://ocr.space/ free api 
>>>>>>> 245b75f6cd3d4192deb356b5b51194799e500e4b
- Express.js for the server framework
- Multer for file upload handling

## Support

<<<<<<< HEAD
For support, email your queries to [sreenivasadyourworld@gmail.com] or open an issue in the GitHub repository.
=======
For support, email your queries to [sreenivasadyourworld@gmail.com] or open an issue in the GitHub repository. 
>>>>>>> 245b75f6cd3d4192deb356b5b51194799e500e4b
