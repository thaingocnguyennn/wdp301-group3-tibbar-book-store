import { createContext, useContext, useEffect, useState } from "react";
import { cartApi } from "../api/cartApi";
import { useAuth } from "../hooks/useAuth";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [cart, setCart] = useState({ items: [] });

  useEffect(() => {
    // B1: Chờ AuthContext khởi tạo xong (tránh gọi API khi chưa biết trạng thái đăng nhập).
    if (loading) return;

    // B2: Nếu chưa đăng nhập, reset giỏ về rỗng ở phía client.
    if (!isAuthenticated) {
      setCart({ items: [] });
      return;
    }

    // B3: Nếu đã đăng nhập, tải giỏ hàng hiện tại từ backend.
    fetchCart();
  }, [isAuthenticated, loading]);

  const fetchCart = async () => {
    // Hàm nền tảng: đồng bộ trạng thái giỏ hàng từ server về local state.
    // Dùng lại sau mọi thao tác add/update/remove để tránh lệch dữ liệu giữa UI và DB.
    if (!isAuthenticated) return;
    const res = await cartApi.getCart();
    setCart(res.data.cart || { items: [] });
  };

  const add = async (bookId, quantity = 1) => {
    // UC-27 - B1: Gọi API thêm sách vào giỏ theo bookId và quantity.
    await cartApi.addToCart(bookId, quantity);
    // UC-27 - B2: Tải lại cart để cập nhật tổng tiền, số lượng và danh sách item.
    fetchCart();
  };

  const update = async (bookId, quantity) => {
    // UC-28 - B1: Gọi API cập nhật số lượng item trong giỏ.
    // Lưu ý: backend có thể tự chuyển sang xóa item khi quantity <= 0.
    await cartApi.updateCartItem(bookId, quantity);
    // UC-28 - B2: Đồng bộ lại cart sau khi backend xử lý.
    fetchCart();
  };

  const remove = async (bookId) => {
    // UC-28 - B1: Gọi API xóa hẳn item khỏi cart theo bookId.
    await cartApi.removeCartItem(bookId);
    // UC-28 - B2: Tải lại cart để UI phản ánh danh sách mới.
    fetchCart();
  };

  const validate = async () => {
    // Validate dùng trước checkout: kiểm tra tồn kho/trạng thái hợp lệ của giỏ.
    const res = await cartApi.validateCart();
    return res.data;
  };

  return (
    <CartContext.Provider
      value={{ cart, fetchCart, add, update, remove, validate }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
