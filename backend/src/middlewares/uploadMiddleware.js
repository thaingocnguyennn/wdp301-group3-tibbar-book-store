import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const sliderUploadsDir = path.join(uploadsRoot, "sliders");
const bookUploadsDir = path.join(uploadsRoot, "books");
const previewUploadsDir = path.join(uploadsRoot, "book-previews");

[sliderUploadsDir, bookUploadsDir, previewUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const createStorage = (destinationDir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};
// Tạo thư mục uploads/delivery-proofs nếu chưa tồn tại
const deliveryUploadsDir = path.join(uploadsRoot, "delivery-proofs");

[sliderUploadsDir, bookUploadsDir, previewUploadsDir, deliveryUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
export const sliderUpload = multer({
  storage: createStorage(sliderUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const bookUpload = multer({
  storage: createStorage(bookUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const previewUpload = multer({
  storage: createStorage(previewUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});
// Middleware upload cho bằng chứng giao hàng của shipper
export const deliveryProofUpload = multer({
  storage: createStorage(deliveryUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});