import News from "../models/News.js";
import ApiError from "../utils/ApiError.js";

class NewsService {
  async getHomepageNews() {
    return News.find({ showOnHomepage: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
  }

  async getPublicNews() {
    return News.find({}).sort({ createdAt: -1 }).lean();
  }

  async getNewsById(id) {
    const news = await News.findById(id).lean();

    if (!news) {
      throw ApiError.notFound("News not found");
    }

    return news;
  }

  async getAllNewsAdmin() {
    return News.find({}).sort({ createdAt: -1 }).lean();
  }

  async createNews(data) {
    return News.create(data);
  }

  async updateNews(id, data) {
    const news = await News.findByIdAndUpdate(id, { $set: data }, {
      new: true,
      runValidators: true,
    });

    if (!news) {
      throw ApiError.notFound("News not found");
    }

    return news;
  }

  async deleteNews(id) {
    const news = await News.findByIdAndDelete(id);

    if (!news) {
      throw ApiError.notFound("News not found");
    }

    return news;
  }
}

export default new NewsService();
