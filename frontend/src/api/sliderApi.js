import axiosInstance from "./axios.js";

export const sliderApi = {
  getPublicSliders: async () => {
    const response = await axiosInstance.get("/sliders");
    return response.data;
  },

  getAllSlidersAdmin: async () => {
    const response = await axiosInstance.get("/admin/sliders");
    return response.data;
  },

  createSlider: async (formData) => {
    const response = await axiosInstance.post("/admin/sliders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateSlider: async (id, formData) => {
    const response = await axiosInstance.put(`/admin/sliders/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateVisibility: async (id, visibility) => {
    const response = await axiosInstance.patch(
      `/admin/sliders/${id}/visibility`,
      {
        visibility,
      },
    );
    return response.data;
  },

  deleteSlider: async (id) => {
    const response = await axiosInstance.delete(`/admin/sliders/${id}`);
    return response.data;
  },
};
