import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

/**
 * AddToCartButton Component
 * Nút thêm sách vào giỏ hàng
 */
const AddToCartButton = ({ bookId, quantity = 1, style = {}, onSuccess }) => {
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    // Check authentication
    if (!isAuthenticated) {
      if (confirm("Please login to add items to cart. Go to login page?")) {
        navigate("/login");
      }
      return;
    }

    try {
      setAdding(true);
      await addToCart(bookId, quantity);
      alert("Item added to cart successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      alert(error.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={adding || cartLoading}
      style={{ ...styles.button, ...style }}
    >
      {adding ? "Adding..." : "🛒 Add to Cart"}
    </button>
  );
};

const styles = {
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

export default AddToCartButton;
