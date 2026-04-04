import News from "../models/News.js";
import ApiError from "../utils/ApiError.js";

class NewsService {
  //ham lay danh sach news cho homepage
  async getHomepageNews() {
    //goi ham find de lay danh sach news va sap xep theo thoi gian cap nhat giam dan va gioi han 4 news moi nhat
    return News.find({})
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean();
  }

  //ham lay danh sach news cho public
  async getNewsById(id) {
    //goi ham findById de lay news theo id va su dung lean de tra ve doi tuong thu gon hon
    const news = await News.findById(id).lean();

    //neu khong tim thay news thi throw ApiError notFound
    if (!news) {
      throw ApiError.notFound("News not found");
    }

    //tra ve news
    return news;
  }

  //ham lay danh sach news cho admin
  async getAllNewsAdmin() {
    //goi ham find de lay danh sach news va sap xep theo thoi gian tao giam dan va su dung lean de tra ve doi tuong thu gon hon
    return News.find({}).sort({ createdAt: -1 }).lean();
  }

  //ham tao news moi
  async createNews(data) {
    //goi ham create de tao news moi va truyen data vao
    return News.create(data);
  }

  //  ham update news
  async updateNews(id, data) {
    //goi ham findByIdAndUpdate de cap nhat news theo id va truyen data vao
    const news = await News.findByIdAndUpdate(id, { $set: data }, {
      //su dung new: true de tra ve news sau khi da duoc cap nhat 
      new: true,
      //runValidators: true de chay cac quy tac validate khi cap nhat
      runValidators: true,
    });

    //neu khong tim thay news thi throw ApiError notFound
    if (!news) {
      throw ApiError.notFound("News not found");
    }

    return news;
  }

  //ham delete news
  async deleteNews(id) {
    //goi ham findByIdAndDelete de xoa news theo id
    const news = await News.findByIdAndDelete(id);

    //neu khong tim thay news thi throw ApiError notFound
    if (!news) {
      throw ApiError.notFound("News not found");
    }

    return news;
  }
}

export default new NewsService();
