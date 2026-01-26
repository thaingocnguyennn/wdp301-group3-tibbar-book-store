export const ROLES = {
  GUEST: "guest",
  CUSTOMER: "customer",
  ADMIN: "admin",
  MANAGER: "manager",
  SHIPPER: "shipper",
};

export const BOOK_VISIBILITY = {
  PUBLIC: "public",
  HIDDEN: "hidden",
};

export const SLIDER_VISIBILITY = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTER_SUCCESS: "User registered successfully",
  TOKEN_REFRESHED: "Token refreshed successfully",

  // User
  PROFILE_FETCHED: "Profile retrieved successfully",
  PROFILE_UPDATED: "Profile updated successfully",

  // Book
  BOOKS_FETCHED: "Books retrieved successfully",
  BOOK_FETCHED: "Book retrieved successfully",
  BOOK_CREATED: "Book created successfully",
  BOOK_UPDATED: "Book updated successfully",
  BOOK_DELETED: "Book deleted successfully",
  VISIBILITY_UPDATED: "Book visibility updated successfully",

  // Category
  CATEGORIES_FETCHED: "Categories retrieved successfully",
  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_DELETED: "Category deleted successfully",

  // Slider
  SLIDERS_FETCHED: "Sliders retrieved successfully",
  SLIDER_CREATED: "Slider created successfully",
  SLIDER_UPDATED: "Slider updated successfully",
  SLIDER_DELETED: "Slider deleted successfully",
  SLIDER_VISIBILITY_UPDATED: "Slider visibility updated successfully",

  // Cart
  CART_FETCHED: "Cart retrieved successfully",
  ITEM_ADDED: "Item added to cart successfully",
  ITEM_UPDATED: "Cart item updated successfully",
  ITEM_REMOVED: "Item removed from cart successfully",
  CART_CLEARED: "Cart cleared successfully",
  CART_VALIDATED: "Cart validated successfully",

  // Errors
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  NOT_FOUND: "Resource not found",
  EMAIL_EXISTS: "Email already exists",
  INVALID_TOKEN: "Invalid or expired token",
  SERVER_ERROR: "Internal server error",
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
};
