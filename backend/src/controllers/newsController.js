import newsService from "../services/newsService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class NewsController {
  //ham lay danh sach news cho homepage
  async getHomepageNews(req, res, next) {
    try {
      //goi ham getHomepageNews de lay danh sach news cho homepage
      const news = await newsService.getHomepageNews();
      //goi ham success de tra ve ket qua
      return ApiResponse.success(res, HTTP_STATUS.OK, "Homepage news fetched", {
        news,
      });
    } catch (error) {
      next(error);
    }
  }


  //ham lay danh sach news cho public
  async getNewsById(req, res, next) {
    try {
      //goi ham getNewsById de lay news
      const news = await newsService.getNewsById(req.params.id);
      //goi ham success de tra ve ket qua
      return ApiResponse.success(res, HTTP_STATUS.OK, "News fetched", { news });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsController();
