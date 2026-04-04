import { useEffect, useState } from "react";
import { getInventoryStockApi } from "../../api/adminInventoryApi";

export default function InventoryManagementPage() {
  // UC-126: Màn hình Inventory Management cho admin xem tổng số lượng còn lại theo từng đầu sách.
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalTypes: 0,
    totalRemaining: 0,
  });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  // Chuẩn hóa base URL để ghép đường dẫn ảnh bìa khi backend trả imageUrl dạng tương đối.
  const serverBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  const loadData = async (page = 1, query = q) => {
    try {
      // B1: bật loading + xóa lỗi cũ trước mỗi lần gọi API.
      setLoading(true);
      setErr("");

      // B2: gọi API tồn kho admin, truyền page/limit/query để phân trang + tìm kiếm.
      const res = await getInventoryStockApi({ page, limit: meta.limit, q: query });
      // B3: tách phần data và meta theo format response của backend.
      const payload = res?.data?.data ?? res?.data ?? [];
      const metaPayload = res?.data?.meta ?? {};

      // B4: cập nhật danh sách đầu sách và metadata tổng tồn kho.
      setRows(Array.isArray(payload) ? payload : []);
      setMeta((prev) => ({
        ...prev,
        ...metaPayload,
        page: Number(metaPayload.page || page),
      }));
    } catch (e) {
      // B5: nếu lỗi, làm rỗng bảng và hiển thị thông báo lỗi thân thiện.
      setRows([]);
      setErr(e?.response?.data?.message || "Không tải được dữ liệu tồn kho");
    } finally {
      // B6: luôn tắt loading sau khi request hoàn tất.
      setLoading(false);
    }
  };

  useEffect(() => {
    // Khi vào màn hình lần đầu, tải trang 1 và chưa lọc theo từ khóa.
    loadData(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    // Chặn submit mặc định để tránh reload trang.
    e.preventDefault();
    // Khi search, luôn quay về page 1 để kết quả nhất quán.
    loadData(1, q.trim());
  };

  // UC-124 (Admin): đếm số đầu sách sắp hết hàng theo ngưỡng <= 5 để cảnh báo trên dashboard.
  const lowStockCount = rows.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= 5).length;
  const outOfStockCount = rows.filter((item) => Number(item.stock || 0) <= 0).length;

  const getStockBadge = (stock) => {
    // UC-124: Chuẩn hóa trạng thái tồn kho để hiển thị badge cảnh báo rõ ràng.
    if (stock <= 0) {
      return { text: "Out of stock", style: styles.stockBadgeOut };
    }
    if (stock <= 5) {
      return { text: "Low stock", style: styles.stockBadgeLow };
    }
    return { text: "In stock", style: styles.stockBadgeGood };
  };

  const resolveImageUrl = (path) => {
    // Hỗ trợ cả URL tuyệt đối và đường dẫn tương đối từ backend.
    if (!path) return "";
    return path.startsWith("http") ? path : `${serverBaseUrl}/${String(path).replace(/^\/+/, "")}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Inventory Management</h1>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          {/* UC-126: Tổng số đầu sách hiện có trong kết quả lọc. */}
          <div style={styles.summaryLabel}>Total Book Types</div>
          <div style={styles.summaryValue}>{meta.totalTypes}</div>
        </div>
        <div style={styles.summaryCard}>
          {/* UC-126: Tổng số lượng sách còn lại trong kho (cộng stock toàn bộ đầu sách). */}
          <div style={styles.summaryLabel}>Total Remaining Stock</div>
          <div style={styles.summaryValue}>{Number(meta.totalRemaining || 0).toLocaleString("en-US")}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Low Stock (1-5)</div>
          <div style={styles.summaryValueWarn}>{lowStockCount}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Out of Stock</div>
          <div style={styles.summaryValueDanger}>{outOfStockCount}</div>
        </div>
      </div>

      <form onSubmit={onSearch} style={styles.filterBar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by book title..."
          style={styles.searchInput}
        />
        <button type="submit" style={styles.primaryButton}>
          Search
        </button>
      </form>

      {loading && <div style={styles.loading}>Loading inventory...</div>}
      {err && <div style={styles.error}>{err}</div>}

      {!loading && !err && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Cover</th>
                <th style={styles.th}>Book Title</th>
                <th style={styles.th}>Author</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Remaining Qty</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const stock = Number(r.stock || 0);
                const badge = getStockBadge(stock);

                return (
                  <tr key={r._id}>
                    <td style={styles.td}>
                      {r.imageUrl ? (
                        <img src={resolveImageUrl(r.imageUrl)} alt={r.title} style={styles.coverImage} />
                      ) : (
                        <div style={styles.coverPlaceholder}>No image</div>
                      )}
                    </td>
                    <td style={styles.tdTitle}>{r.title}</td>
                    <td style={styles.td}>{r.author || "-"}</td>
                    <td style={styles.td}>{r.category || "-"}</td>
                    <td style={styles.tdQty}>{stock}</td>
                    <td style={styles.td}>
                      {/* UC-126: Badge trực quan trạng thái tồn kho của từng đầu sách. */}
                      <span style={{ ...styles.stockBadge, ...badge.style }}>{badge.text}</span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td style={styles.empty} colSpan={6}>
                    No inventory data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.paginationRow}>
        <button
          type="button"
          disabled={meta.page <= 1 || loading}
          onClick={() => loadData(meta.page - 1, q)}
          style={styles.secondaryButton}
        >
          Previous
        </button>
        <span style={styles.pageLabel}>
          Page {meta.page}/{meta.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={meta.page >= (meta.totalPages || 1) || loading}
          onClick={() => loadData(meta.page + 1, q)}
          style={styles.secondaryButton}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "2rem",
    color: "#2c3e50",
    margin: 0,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    padding: "1rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  summaryValue: {
    color: "#1e293b",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  summaryValueWarn: {
    color: "#b45309",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  summaryValueDanger: {
    color: "#dc2626",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  filterBar: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  searchInput: {
    flex: "1 1 280px",
    padding: "0.65rem 0.8rem",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.65rem 1rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.5rem 0.85rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrap: {
    overflowX: "auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "1px solid #e2e8f0",
    padding: "0.85rem",
    textAlign: "left",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "0.88rem",
    fontWeight: 700,
  },
  td: {
    borderBottom: "1px solid #f1f5f9",
    padding: "0.85rem",
    color: "#334155",
    fontSize: "0.92rem",
  },
  tdTitle: {
    borderBottom: "1px solid #f1f5f9",
    padding: "0.85rem",
    color: "#1e293b",
    fontWeight: 600,
    fontSize: "0.92rem",
  },
  tdQty: {
    borderBottom: "1px solid #f1f5f9",
    padding: "0.85rem",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "0.92rem",
  },
  coverImage: {
    width: "48px",
    height: "64px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    display: "block",
  },
  coverPlaceholder: {
    width: "48px",
    height: "64px",
    borderRadius: "6px",
    border: "1px dashed #cbd5e1",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.65rem",
    textAlign: "center",
    padding: "0.2rem",
    backgroundColor: "#f8fafc",
  },
  stockBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.3rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    border: "1px solid transparent",
  },
  stockBadgeGood: {
    backgroundColor: "#ecfdf3",
    color: "#166534",
    borderColor: "#86efac",
  },
  stockBadgeLow: {
    backgroundColor: "#fffbeb",
    color: "#92400e",
    borderColor: "#fcd34d",
  },
  stockBadgeOut: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderColor: "#fca5a5",
  },
  empty: {
    padding: "1.25rem",
    textAlign: "center",
    color: "#64748b",
  },
  paginationRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  pageLabel: {
    color: "#475569",
    fontWeight: 600,
  },
  loading: {
    color: "#475569",
    marginBottom: "0.75rem",
  },
  error: {
    color: "#dc2626",
    marginBottom: "0.75rem",
    fontWeight: 600,
  },
};