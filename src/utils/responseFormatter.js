exports.success = (data, message = 'Operación exitosa') => {
  return {
    success: true,
    message,
    data,
  };
};

exports.error = (message = 'Error en la operación', statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
