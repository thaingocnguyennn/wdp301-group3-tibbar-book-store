import newsService from "../services/newsService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class NewsController {
  async getHomepageNews(req, res, next) {
    try {
      const news = await newsService.getHomepageNews();
      return ApiResponse.success(res, HTTP_STATUS.OK, "Homepage news fetched", {
        news,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicNews(req, res, next) {
    try {
      const news = await newsService.getPublicNews();
      return ApiResponse.success(res, HTTP_STATUS.OK, "News fetched", { news });
    } catch (error) {
      next(error);
    }
  }

  async getNewsById(req, res, next) {
    try {
      const news = await newsService.getNewsById(req.params.id);
      return ApiResponse.success(res, HTTP_STATUS.OK, "News fetched", { news });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsController();
