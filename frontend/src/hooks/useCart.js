import { useContext } from "react";
import { CartContext } from "../context/CartContext";

// Hook trung gian cho UC-27/UC-28:
// pages (BookDetail/CartPage) gọi useCart() để lấy các hàm add/update/remove
// đã được định nghĩa và đồng bộ dữ liệu trong CartContext.
export const useCart = () => useContext(CartContext);
