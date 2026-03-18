import { createContext, useContext, useEffect, useState } from 'react';
import { wishlistApi } from '../api/wishlistApi';
import { useAuth } from '../hooks/useAuth';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      setWishlist([]);        // ✅ logout là clear liền
      return;
    }

    fetchWishlist();          // ✅ login / reload là fetch
  }, [isAuthenticated, loading]);



  const fetchWishlist = async () => {
    if (!isAuthenticated || !user) return;

    const res = await wishlistApi.get();
    setWishlist(res.data.wishlist?.books || []);
  };


  const add = async (bookId) => {
    if (wishlist.some(b => b._id === bookId)) return; // 🛑 CHỐT CHẶN
    await wishlistApi.add(bookId);
    fetchWishlist();
  };


  const remove = async (bookId) => {
    await wishlistApi.remove(bookId);
    fetchWishlist();
  };

  return (
    <WishlistContext.Provider value={{ wishlist, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
