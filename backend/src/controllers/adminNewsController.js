import newsService from "../services/newsService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminNewsController {
  //ham lay danh sach news cho admin
  async getAllNews(req, res, next) {
    try {
      //goi ham getAllNewsAdmin de lay danh sach news
      const news = await newsService.getAllNewsAdmin();
      //goi ham success de tra ve ket qua
      return ApiResponse.success(res, HTTP_STATUS.OK, "News fetched", { news });
    } catch (error) {
      next(error);
    }
  }

  //ham tao news moi
  async createNews(req, res, next) {
    try {
      //tao doi tuong payload de chua du lieu tu request
      const payload = {
        title: req.body.title,
        content: req.body.content,
      };

      //neu co file anh duoc upload thi them duong dan anh vao payload
      if (req.file) {
        payload.imageUrl = `/uploads/news/${req.file.filename}`;
      }

      //goi ham createNews de tao news moi va truyen payload vao
      const news = await newsService.createNews(payload);

      //goi ham success de tra ve ket qua
      return ApiResponse.success(res, HTTP_STATUS.CREATED, "News created", {
        news,
      });
    } catch (error) {
      next(error);
    }
  }

  //ham update news
  async updateNews(req, res, next) {
    try {
      //tao doi tuong payload de chua du lieu tu request
      const payload = {
        title: req.body.title,
        content: req.body.content,
      };

      //neu co file anh duoc upload thi them duong dan anh vao payload
      if (req.file) {
        payload.imageUrl = `/uploads/news/${req.file.filename}`;
      }

      //loai bo cac truong co gia tri undefined trong payload de tranh viec update nhung truong khong duoc cap nhat
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      //goi ham updateNews de cap nhat news va truyen id va payload vao
      const news = await newsService.updateNews(req.params.id, payload);

      //goi ham success de tra ve ket qua
      return ApiResponse.success(res, HTTP_STATUS.OK, "News updated", {
        news,
      });
    } catch (error) {
      next(error);
    }
  }

  //ham delete news
  async deleteNews(req, res, next) {
    try {
      //goi ham deleteNews de xoa news va truyen id vao
      await newsService.deleteNews(req.params.id);
      //goi ham success de tra ve ket qua
      return ApiResponse.success(res, HTTP_STATUS.OK, "News deleted");
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminNewsController();
