const multer = require('multer');

// Configuración de almacenamiento temporal para multer
const storage = multer.memoryStorage();

// Filtro para solo permitir imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter,
});

module.exports = {
  uploadSingle: upload.single('profileImage'),
};
