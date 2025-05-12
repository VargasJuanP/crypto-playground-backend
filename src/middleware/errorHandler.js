const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Errores de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: messages });
  }

  // Error de ID de MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID no válido' });
  }

  // Error de duplicados
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Valor duplicado, ya existe en la base de datos' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Error en el servidor',
  });
};

module.exports = errorHandler;
