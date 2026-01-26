import { createContext, useState, useEffect } from "react";
import { cartApi } from "../api/cartApi";
import { useAuth } from "../hooks/useAuth";

export const CartContext = createContext(null);

/**
 * CartProvider - Quản lý state của giỏ hàng
 *
 * Cung cấp:
 * - cart: Object chứa items, totalPrice, totalItems
 * - loading: Boolean
 * - Các functions: addToCart, updateQuantity, removeItem, clearCart, validateCart
 */
export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart khi user đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  /**
   * Lấy giỏ hàng từ server
   */
  const fetchCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      setCart(response.data.cart);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError(err.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Thêm sách vào giỏ hàng
   * @param {string} bookId - ID của sách
   * @param {number} quantity - Số lượng (default: 1)
   * @returns {Promise} Response data hoặc throw error
   */
  const addToCart = async (bookId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error("Please login to add items to cart");
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.addToCart(bookId, quantity);
      setCart(response.data.cart);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add to cart";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cập nhật số lượng item trong cart
   * @param {string} bookId - ID của sách
   * @param {number} quantity - Số lượng mới
   */
  const updateQuantity = async (bookId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.updateCartItem(bookId, quantity);
      setCart(response.data.cart);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update cart";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xóa item khỏi cart
   * @param {string} bookId - ID của sách
   */
  const removeItem = async (bookId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.removeFromCart(bookId);
      setCart(response.data.cart);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to remove item";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xóa toàn bộ giỏ hàng
   */
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.clearCart();
      setCart(response.data.cart);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to clear cart";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate cart trước khi checkout
   * @returns {Object} Validation result { isValid, errors, warnings }
   */
  const validateCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.validateCart();
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to validate cart";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Tính tổng số items trong cart (để hiển thị badge)
  const cartItemCount = cart?.totalItems || 0;

  const value = {
    cart,
    loading,
    error,
    cartItemCount,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
