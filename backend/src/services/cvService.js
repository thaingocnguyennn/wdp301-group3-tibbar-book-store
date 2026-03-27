import CVApplication from "../models/CVApplication.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

const toCustomerName = (user) => {
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return fullName || user?.email || "Unknown Customer";
};

class CVService {
  async createApplication(customerId, file) {
    if (!file) {
      throw ApiError.badRequest("CV PDF file is required");
    }

    const customer = await User.findById(customerId).lean();
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }

    const payload = {
      customer: customerId,
      fullName: toCustomerName(customer),
      email: customer.email,
      cvFileUrl: `/uploads/cvs/${file.filename}`,
      originalFileName: file.originalname,
      status: "PENDING",
      adminNote: "",
      reviewedAt: null,
      reviewedBy: null,
    };

    return CVApplication.create(payload);
  }

  async getCustomerApplications(customerId) {
    return CVApplication.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAdminApplications({ status, keyword }) {
    const query = {};

    if (status) {
      const normalizedStatus = String(status).trim().toUpperCase();
      if (["PENDING", "ACCEPTED", "REJECTED"].includes(normalizedStatus)) {
        query.status = normalizedStatus;
      }
    }

    if (keyword && String(keyword).trim()) {
      const safeKeyword = String(keyword).trim();
      query.$or = [
        { fullName: { $regex: safeKeyword, $options: "i" } },
        { email: { $regex: safeKeyword, $options: "i" } },
        { originalFileName: { $regex: safeKeyword, $options: "i" } },
      ];
    }

    return CVApplication.find(query)
      .sort({ createdAt: -1 })
      .populate("customer", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email")
      .lean();
  }

  async updateApplicationStatus(adminId, applicationId, payload = {}) {
    const status = String(payload.status || "").trim().toUpperCase();
    const adminNote = String(payload.adminNote || "").trim();

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      throw ApiError.badRequest("Status must be ACCEPTED or REJECTED");
    }

    const application = await CVApplication.findById(applicationId);
    if (!application) {
      throw ApiError.notFound("CV application not found");
    }

    if (application.status !== "PENDING") {
      throw ApiError.badRequest("Only pending CV applications can be reviewed");
    }

    application.status = status;
    application.adminNote = adminNote;
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;

    await application.save();

    return CVApplication.findById(applicationId)
      .populate("customer", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email")
      .lean();
  }
}

export default new CVService();
