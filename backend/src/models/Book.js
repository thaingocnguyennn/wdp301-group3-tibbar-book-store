import mongoose from 'mongoose';
import { BOOK_VISIBILITY } from '../config/constants.js';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  publishedDate: {
    type: Date
  },
  visibility: {
    type: String,
    enum: Object.values(BOOK_VISIBILITY),
    default: BOOK_VISIBILITY.PUBLIC
  }
}, {
  timestamps: true
});

// Indexes for performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1, visibility: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ createdAt: -1 });

// Virtual for checking if book is in stock
bookSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Query helper for public books
bookSchema.query.publicOnly = function() {
  return this.where({ visibility: BOOK_VISIBILITY.PUBLIC });
};

const Book = mongoose.model('Book', bookSchema);

export default Book;