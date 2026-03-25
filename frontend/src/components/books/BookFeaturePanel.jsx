import { useEffect, useMemo, useState } from "react";
import { compareBooksApi, subscribeBackStockAlertApi } from "../../api/bookFeatureApi";

export default function BookFeaturePanel({
  book,
  layout = "stack",
  showToggle = true,
  showStockAlert = true,
  showBackStock = true,
}) {
  const threshold = 5;
  const stock = Number(book?.stock || 0);
  const isLowStock = stock > 0 && stock <= threshold;
  const isOutOfStock = stock <= 0;
  const isInline = layout === "inline";

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [compareData, setCompareData] = useState([]);
  const [compareError, setCompareError] = useState("");

  const readCompareIds = () => {
    try {
      const raw = JSON.parse(localStorage.getItem("compareBookIds") || "[]");
      return Array.isArray(raw) ? raw.filter((id) => /^[a-f\d]{24}$/i.test(String(id))) : [];
    } catch {
      return [];
    }
  };

  const [compareIds, setCompareIds] = useState(readCompareIds);

  const currentId = String(book?._id || "");
  const isInCompare = useMemo(() => compareIds.includes(currentId), [compareIds, currentId]);

  useEffect(() => {
    localStorage.setItem("compareBookIds", JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    const syncCompare = () => setCompareIds(readCompareIds());
    window.addEventListener("storage", syncCompare);
    window.addEventListener("compare-updated", syncCompare);
    return () => {
      window.removeEventListener("storage", syncCompare);
      window.removeEventListener("compare-updated", syncCompare);
    };
  }, []);

  useEffect(() => {
    const loadCompare = async () => {
      setCompareError("");
      if (compareIds.length < 2) {
        setCompareData([]);
        return;
      }

      const res = await compareBooksApi(compareIds);
      const payload = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

      setCompareData(payload);
    };

    loadCompare().catch((err) => {
      setCompareData([]);
      setCompareError(err?.response?.data?.message || "Không tải được dữ liệu so sánh");
    });
  }, [compareIds]);

  const onToggleCompare = () => {
    if (!currentId) return;
    setCompareIds((prev) => {
      if (prev.includes(currentId)) return prev.filter((id) => id !== currentId);
      if (prev.length >= 4) return prev;
      return [...prev, currentId];
    });
  };

  const onSubscribe = async () => {
    try {
      setMsg("");
      const res = await subscribeBackStockAlertApi({ bookId: currentId, email });
      setMsg(res?.data?.message || res?.message || "Đăng ký thành công");
    } catch (error) {
      setMsg(error?.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div
      style={{
        marginTop: isInline ? 12 : 16,
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
      }}
    >
      {showStockAlert && (isLowStock || isOutOfStock) && (
        <div
          style={{
            marginBottom: 10,
            fontWeight: 600,
            color: isOutOfStock ? "#e74c3c" : "#b45309",
          }}
        >
          {isOutOfStock ? "✗ Hết hàng" : `⚠ Sắp hết hàng, còn ${stock} sản phẩm`}
        </div>
      )}

      {showToggle && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onToggleCompare}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "0.55rem 0.9rem",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 2px 8px rgba(102, 126, 234, 0.25)",
            }}
          >
            {isInCompare ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
          </button>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>({compareIds.length}/4)</span>
        </div>
      )}

      {showBackStock && isOutOfStock && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="Nhập email nhận thông báo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              minWidth: 240,
              padding: "0.55rem 0.7rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={onSubscribe}
            style={{
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "0.55rem 0.9rem",
              backgroundColor: "#334155",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Đăng ký báo có hàng
          </button>
        </div>
      )}

      {msg && <div style={{ marginTop: 8, color: "#16a34a", fontSize: 13 }}>{msg}</div>}
      {compareError && <div style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{compareError}</div>}
      {compareIds.length < 2 && (
        <div style={{ marginTop: 8, color: "#64748b", fontSize: 13 }}>
          Chọn thêm 1 sách nữa để so sánh.
        </div>
      )}

      {compareData.length >= 2 && (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: 8 }}>
            <thead>
              <tr style={{ backgroundColor: "#eef2ff" }}>
                <th style={thStyle}>Tiêu chí</th>
                {compareData.map((b) => (
                  <th key={b._id} style={thStyle}>{b.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdKeyStyle}>Author</td>
                {compareData.map((b) => <td key={`${b._id}-author`} style={tdStyle}>{b.author}</td>)}
              </tr>
              <tr>
                <td style={tdKeyStyle}>Price</td>
                {compareData.map((b) => <td key={`${b._id}-price`} style={tdStyle}>{Number(b.price || 0).toLocaleString("vi-VN")}₫</td>)}
              </tr>
              <tr>
                <td style={tdKeyStyle}>Rating</td>
                {compareData.map((b) => <td key={`${b._id}-rating`} style={tdStyle}>{b.avgRating} ({b.totalReviews})</td>)}
              </tr>
              <tr>
                <td style={tdKeyStyle}>Stock</td>
                {compareData.map((b) => <td key={`${b._id}-stock`} style={tdStyle}>{b.stock}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  border: "1px solid #e2e8f0",
  padding: "8px",
  textAlign: "left",
  color: "#2c3e50",
  fontSize: "0.9rem",
};

const tdStyle = {
  border: "1px solid #e2e8f0",
  padding: "8px",
  color: "#334155",
  fontSize: "0.9rem",
};

const tdKeyStyle = {
  ...tdStyle,
  fontWeight: 700,
  color: "#1e293b",
  backgroundColor: "#f8fafc",
};