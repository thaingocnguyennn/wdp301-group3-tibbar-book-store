import axios from './axios';

export const wishlistApi = {
  get: () =>
    axios.get('/wishlist'),

  add: (bookId) =>
    axios.post(`/wishlist/${bookId}`),

  remove: (bookId) =>
    axios.delete(`/wishlist/${bookId}`)
};