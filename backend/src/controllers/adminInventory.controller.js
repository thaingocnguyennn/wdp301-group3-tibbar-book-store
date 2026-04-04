import Book from "../models/Book.js";

/**
 * GET /api/admin/inventory/stock
 * Admin xem tồn kho theo từng đầu sách.
 * Query:
 *  - q: tìm theo tiêu đề
 *  - page: trang hiện tại (default 1)
 *  - limit: số bản ghi / trang (default 20)
 */
export const getInventoryStock = async (req, res, next) => {
  try {
    // UC-126: Controller xử lý trực tiếp tại đây (hiện chưa tách riêng service adminInventoryService).
    // B1: Chuẩn hóa query đầu vào để tránh lỗi kiểu dữ liệu.
    const q = String(req.query.q || "").trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // B2: Nếu có từ khóa q thì lọc theo title (không phân biệt hoa thường).
    const match = q
      ? {
          title: { $regex: q, $options: "i" },
        }
      : {};

    // Mỗi sách là 1 "type" trong tồn kho, lấy số lượng còn lại ở field stock.
    // B3: Chạy song song 3 truy vấn để tối ưu tốc độ phản hồi.
    const [rows, totalTypesAgg, totalRemainingAgg] = await Promise.all([
      Book.find(match)
        .select("_id title author stock category imageUrl")
        .sort({ stock: 1, title: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(match),
      Book.aggregate([
        { $match: match },
        { $group: { _id: null, totalRemaining: { $sum: { $ifNull: ["$stock", 0] } } } },
      ]),
    ]);

    // B4: Chuẩn hóa số liệu tổng để trả về frontend.
    const totalTypes = Number(totalTypesAgg || 0);
    const totalRemaining = Number(totalRemainingAgg?.[0]?.totalRemaining || 0);

    // B5: Trả payload gồm data theo từng đầu sách + meta phân trang + tổng tồn kho.
    return res.status(200).json({
      message: "Lấy dữ liệu tồn kho thành công",
      data: rows.map((b) => ({
        _id: b._id,
        title: b.title || "",
        author: b.author || "",
        category: b.category?.name || b.category || "",
        imageUrl: b.imageUrl || "",
        stock: Number(b.stock || 0),
      })),
      meta: {
        page,
        limit,
        totalTypes,
        totalPages: Math.ceil(totalTypes / limit),
        totalRemaining,
      },
    });
  } catch (error) {
    next(error);
  }
};