import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, {
  timestamps: true
});

// Index for faster queries
categorySchema.index({ isDeleted: 1 });

// Query helper to exclude deleted categories by default
categorySchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

const Category = mongoose.model('Category', categorySchema);

export default Category;