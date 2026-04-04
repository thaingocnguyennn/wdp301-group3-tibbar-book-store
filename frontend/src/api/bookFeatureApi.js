import axiosClient from './axios';

// UC-124: Low Stock Alert
// API lấy danh sách sách sắp hết hàng/hết hàng theo ngưỡng threshold.
// Endpoint thực tế: GET /api/book-features/low-stock?threshold=5
export const getLowStockBooksApi = (threshold = 5) =>
  axiosClient.get(`/book-features/low-stock?threshold=${threshold}`);

// UC-125: Back Stock Alert
// API đăng ký email nhận thông báo khi sách có hàng lại.
// Endpoint thực tế: POST /api/book-features/back-stock/subscribe
export const subscribeBackStockAlertApi = ({ bookId, email }) =>
  axiosClient.post('/book-features/back-stock/subscribe', { bookId, email });

// UC-125: API lấy danh sách các đăng ký đã sẵn sàng thông báo (book đã có stock > 0).
// Endpoint thực tế: GET /api/book-features/back-stock/ready?email=
export const getReadyBackStockAlertsApi = (email) =>
  axiosClient.get(`/book-features/back-stock/ready?email=${encodeURIComponent(email)}`);

// UC-127: Compare Book
// API lấy dữ liệu so sánh nhiều sách theo danh sách ids.
// Endpoint thực tế: GET /api/book-features/compare?ids=id1,id2,...
export const compareBooksApi = (ids = []) =>
  axiosClient.get(`/book-features/compare?ids=${ids.join(',')}`);