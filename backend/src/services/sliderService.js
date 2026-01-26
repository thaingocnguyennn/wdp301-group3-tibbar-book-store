import Slider from "../models/Slider.js";
import ApiError from "../utils/ApiError.js";
import { BOOK_VISIBILITY } from "../config/constants.js";

const MAX_SLIDERS = 5;

class SliderService {
  async getPublicSliders() {
    return Slider.find({ visibility: BOOK_VISIBILITY.PUBLIC })
      .sort({ createdAt: -1 })
      .limit(MAX_SLIDERS)
      .lean();
  }

  async getAllSliders() {
    return Slider.find({}).sort({ createdAt: -1 }).lean();
  }

  async createSlider(data) {
    const total = await Slider.countDocuments();
    if (total >= MAX_SLIDERS) {
      throw ApiError.badRequest(`Slider limit reached (max ${MAX_SLIDERS})`);
    }

    const slider = await Slider.create(data);
    return slider;
  }

  async updateSlider(id, data) {
    const slider = await Slider.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!slider) {
      throw ApiError.notFound("Slider not found");
    }

    return slider;
  }

  async updateVisibility(id, visibility) {
    const slider = await Slider.findByIdAndUpdate(
      id,
      { visibility },
      { new: true, runValidators: true },
    );

    if (!slider) {
      throw ApiError.notFound("Slider not found");
    }

    return slider;
  }

  async deleteSlider(id) {
    const slider = await Slider.findByIdAndDelete(id);

    if (!slider) {
      throw ApiError.notFound("Slider not found");
    }

    return slider;
  }
}

export default new SliderService();
