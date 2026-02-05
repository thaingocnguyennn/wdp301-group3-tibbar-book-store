import wishlistService from '../services/wishlistService.js';

class WishlistController {
  getWishlist = async (req, res, next) => {
    try {
      const wishlist = await wishlistService.getWishlist(req.user.userId);
      res.json({ wishlist });
    } catch (err) {
      next(err);
    }
  };

  addToWishlist = async (req, res, next) => {
    try {
      const wishlist = await wishlistService.addToWishlist(
        req.user.userId,
        req.params.bookId
      );
      res.json({ wishlist });
    } catch (err) {
      next(err);
    }
  };

  removeFromWishlist = async (req, res, next) => {
    try {
      const wishlist = await wishlistService.removeFromWishlist(
        req.user.userId,
        req.params.bookId
      );
      res.json({ wishlist });
    } catch (err) {
      next(err);
    }
  };
}

export default new WishlistController();
