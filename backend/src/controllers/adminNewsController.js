import newsService from "../services/newsService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminNewsController {
  async getAllNews(req, res, next) {
    try {
      const news = await newsService.getAllNewsAdmin();
      return ApiResponse.success(res, HTTP_STATUS.OK, "News fetched", { news });
    } catch (error) {
      next(error);
    }
  }

  async createNews(req, res, next) {
    try {
      const payload = {
        title: req.body.title,
        content: req.body.content,
        showOnHomepage: String(req.body.showOnHomepage) === "true",
      };

      if (req.file) {
        payload.imageUrl = `/uploads/news/${req.file.filename}`;
      }

      const news = await newsService.createNews(payload);

      return ApiResponse.success(res, HTTP_STATUS.CREATED, "News created", {
        news,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNews(req, res, next) {
    try {
      const payload = {
        title: req.body.title,
        content: req.body.content,
      };

      if (req.body.showOnHomepage !== undefined) {
        payload.showOnHomepage = String(req.body.showOnHomepage) === "true";
      }

      if (req.file) {
        payload.imageUrl = `/uploads/news/${req.file.filename}`;
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const news = await newsService.updateNews(req.params.id, payload);

      return ApiResponse.success(res, HTTP_STATUS.OK, "News updated", {
        news,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNews(req, res, next) {
    try {
      await newsService.deleteNews(req.params.id);
      return ApiResponse.success(res, HTTP_STATUS.OK, "News deleted");
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminNewsController();
