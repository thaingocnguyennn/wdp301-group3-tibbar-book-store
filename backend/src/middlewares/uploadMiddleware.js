import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const sliderUploadsDir = path.join(uploadsRoot, "sliders");
const bookUploadsDir = path.join(uploadsRoot, "books");
const ebooksUploadsDir = path.join(uploadsRoot, "ebooks");
const previewUploadsDir = path.join(uploadsRoot, "book-previews");
const newsUploadsDir = path.join(uploadsRoot, "news");
const reviewUploadsDir = path.join(uploadsRoot, "reviews");

[
  sliderUploadsDir,
  bookUploadsDir,
  ebooksUploadsDir,
  previewUploadsDir,
  newsUploadsDir,
  reviewUploadsDir,
].forEach((dir) => {
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

// Combined file filter for admin book uploads (images + PDF)
const combinedBookFileFilter = (req, file, cb) => {
  if (file.fieldname === "ebook") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for e-books"), false);
    }
  } else {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for book covers"), false);
    }
  }
};

// Dynamic storage that routes image to books/ and ebook to ebooks/
const combinedBookStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "ebook") {
      cb(null, ebooksUploadsDir);
    } else {
      cb(null, bookUploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Tạo thư mục uploads/delivery-proofs nếu chưa tồn tại
const deliveryUploadsDir = path.join(uploadsRoot, "delivery-proofs");

[
  sliderUploadsDir,
  bookUploadsDir,
  ebooksUploadsDir,
  previewUploadsDir,
  newsUploadsDir,
  reviewUploadsDir,
  deliveryUploadsDir,
].forEach((dir) => {
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

export const newsUpload = multer({
  storage: createStorage(newsUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const reviewUpload = multer({
  storage: createStorage(reviewUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

// Middleware upload cho bằng chứng giao hàng của shipper
export const deliveryProofUpload = multer({
  storage: createStorage(deliveryUploadsDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Combined upload for admin book create/update (cover image + ebook PDF)
export const adminBookCombinedUpload = multer({
  storage: combinedBookStorage,
  fileFilter: combinedBookFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB to accommodate PDFs
});
