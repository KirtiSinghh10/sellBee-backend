const multer = require("multer");

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(500).json({ message: err.message });
  }

  next();
};
