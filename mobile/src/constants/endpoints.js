// Auth Endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
};

// Book Endpoints
export const BOOK_ENDPOINTS = {
  GET_ALL: '/books',
  GET_BY_ID: '/books/:id',
  SEARCH: '/books',
  GET_BY_CATEGORY: '/books',
};

// Category Endpoints
export const CATEGORY_ENDPOINTS = {
  GET_ALL: '/categories',
};

// Wishlist Endpoints
export const WISHLIST_ENDPOINTS = {
  GET_ALL: '/wishlist',
  ADD: '/wishlist/:bookId',
  REMOVE: '/wishlist/:bookId',
};

// Cart Endpoints
export const CART_ENDPOINTS = {
  GET_ALL: '/cart',
  ADD_ITEM: '/cart/items',
  UPDATE_ITEM: '/cart/items/:bookId',
  REMOVE_ITEM: '/cart/items/:bookId',
  VALIDATE: '/cart/validate',
};

// Order Endpoints
export const ORDER_ENDPOINTS = {
  GET_ALL: '/orders',
  GET_BY_ID: '/orders/:id',
  CREATE: '/orders',
  CANCEL: '/orders/:id/cancel',
  VALIDATE_VOUCHER: '/orders/voucher/validate',
};

// User Endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: '/users/me',
  UPDATE_PROFILE: '/users/me',
  CHANGE_PASSWORD: '/users/me/change-password',
  GET_ADDRESSES: '/addresses',
  ADD_ADDRESS: '/addresses',
  UPDATE_ADDRESS: '/addresses/:addressId',
  DELETE_ADDRESS: '/addresses/:addressId',
};

// Voucher Endpoints
export const VOUCHER_ENDPOINTS = {
  GET_ALL: '/vouchers',
  VALIDATE: '/orders/voucher/validate',
};

// News Endpoints
export const NEWS_ENDPOINTS = {
  GET_ALL: '/news',
  GET_BY_ID: '/news/:newsId',
};

// Support Endpoints
export const SUPPORT_ENDPOINTS = {
  GET_CONVERSATIONS: '/support-system/conversations',
  GET_MESSAGES: '/support-system/conversations/:conversationId',
  SEND_MESSAGE: '/support-system/messages',
  CREATE_CONVERSATION: '/support-system/conversations',
};

// Review Endpoints
export const REVIEW_ENDPOINTS = {
  GET_BY_BOOK: '/reviews/book/:bookId',
  CREATE: '/reviews',
};
