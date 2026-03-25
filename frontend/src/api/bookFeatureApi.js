import axiosClient from './axios';

// Low stock alert
export const getLowStockBooksApi = (threshold = 5) =>
  axiosClient.get(`/book-features/low-stock?threshold=${threshold}`);

// Back stock subscribe
export const subscribeBackStockAlertApi = ({ bookId, email }) =>
  axiosClient.post('/book-features/back-stock/subscribe', { bookId, email });

// Back stock ready list
export const getReadyBackStockAlertsApi = (email) =>
  axiosClient.get(`/book-features/back-stock/ready?email=${encodeURIComponent(email)}`);

// Compare books
export const compareBooksApi = (ids = []) =>
  axiosClient.get(`/book-features/compare?ids=${ids.join(',')}`);