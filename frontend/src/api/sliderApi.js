import axiosInstance from "./axios.js";

/**
 * Slider API Client
 * Handles all slider-related API calls
 */
export const sliderApi = {
  // ==================== PUBLIC APIs ====================

  /**
   * Get visible sliders for homepage
   * No authentication required
   */
  getVisibleSliders: async () => {
    const response = await axiosInstance.get("/sliders/public");
    return response.data;
  },

  // ==================== ADMIN APIs ====================

  /**
   * Get all sliders (including hidden) - Admin only
   * @param {Object} params - Query parameters (visibility, sortBy, sortOrder)
   */
  getAllSliders: async (params = {}) => {
    const response = await axiosInstance.get("/sliders/admin", { params });
    return response.data;
  },

  /**
   * Get slider by ID - Admin only
   * @param {string} id - Slider ID
   */
  getSliderById: async (id) => {
    const response = await axiosInstance.get(`/sliders/admin/${id}`);
    return response.data;
  },

  /**
   * Create new slider - Admin only
   * @param {Object} sliderData - Slider data
   */
  createSlider: async (sliderData) => {
    const response = await axiosInstance.post("/sliders/admin", sliderData);
    return response.data;
  },

  /**
   * Update slider - Admin only
   * @param {string} id - Slider ID
   * @param {Object} updateData - Updated data
   */
  updateSlider: async (id, updateData) => {
    const response = await axiosInstance.put(
      `/sliders/admin/${id}`,
      updateData,
    );
    return response.data;
  },

  /**
   * Toggle slider visibility - Admin only
   * @param {string} id - Slider ID
   * @param {string} visibility - 'visible' or 'hidden'
   */
  toggleVisibility: async (id, visibility) => {
    const response = await axiosInstance.patch(
      `/sliders/admin/${id}/visibility`,
      { visibility },
    );
    return response.data;
  },

  /**
   * Delete slider - Admin only
   * @param {string} id - Slider ID
   */
  deleteSlider: async (id) => {
    const response = await axiosInstance.delete(`/sliders/admin/${id}`);
    return response.data;
  },
};
