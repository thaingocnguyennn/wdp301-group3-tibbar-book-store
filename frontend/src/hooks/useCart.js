import { useContext } from "react";
import { CartContext } from "../context/CartContext";

/**
 * Custom hook to use Cart context
 * @returns {Object} Cart context value
 */
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
