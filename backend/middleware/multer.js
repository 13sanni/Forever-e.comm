import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (file.mimetype?.startsWith("image/")) {
    callback(null, true);
    return;
  }
  callback(new Error("Only image uploads are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
