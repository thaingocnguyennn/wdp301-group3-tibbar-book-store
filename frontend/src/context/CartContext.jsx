import { createContext, useContext, useEffect, useState } from "react";
import { cartApi } from "../api/cartApi";
import { useAuth } from "../hooks/useAuth";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [cart, setCart] = useState({ items: [] });

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      setCart({ items: [] });
      return;
    }

    fetchCart();
  }, [isAuthenticated, loading]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    const res = await cartApi.getCart();
    setCart(res.data.cart || { items: [] });
  };

  const add = async (bookId, quantity = 1) => {
    await cartApi.addToCart(bookId, quantity);
    fetchCart();
  };

  const update = async (bookId, quantity) => {
    await cartApi.updateCartItem(bookId, quantity);
    fetchCart();
  };

  const remove = async (bookId) => {
    await cartApi.removeCartItem(bookId);
    fetchCart();
  };

  const validate = async () => {
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
