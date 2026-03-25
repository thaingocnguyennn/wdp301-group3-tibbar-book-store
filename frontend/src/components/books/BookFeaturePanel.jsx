import { useEffect, useMemo, useState } from 'react';
import { compareBooksApi, subscribeBackStockAlertApi } from '../../api/bookFeatureApi';

// Panel đơn giản cho trang Book Detail
export default function BookFeaturePanel({ book }) {
  const threshold = 5;
  const stock = Number(book?.stock || 0);
  const isLowStock = stock > 0 && stock <= threshold;
  const isOutOfStock = stock <= 0;

  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const [compareIds, setCompareIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('compareBookIds') || '[]');
    } catch {
      return [];
    }
  });
  const [compareData, setCompareData] = useState([]);

  const currentId = String(book?._id || '');
  const isInCompare = useMemo(() => compareIds.includes(currentId), [compareIds, currentId]);

  useEffect(() => {
    localStorage.setItem('compareBookIds', JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    const loadCompare = async () => {
      if (compareIds.length < 2) {
        setCompareData([]);
        return;
      }
      const res = await compareBooksApi(compareIds);
      // Hỗ trợ cả kiểu axios trả res.data hoặc trả thẳng data
      const payload = res?.data?.data || res?.data || [];
      setCompareData(payload);
    };

    loadCompare().catch(() => setCompareData([]));
  }, [compareIds]);

  const onToggleCompare = () => {
    if (!currentId) return;
    setCompareIds((prev) => {
      if (prev.includes(currentId)) return prev.filter((id) => id !== currentId);
      if (prev.length >= 4) return prev; // giới hạn 4 sách
      return [...prev, currentId];
    });
  };

  const onSubscribe = async () => {
    try {
      setMsg('');
      const res = await subscribeBackStockAlertApi({ bookId: currentId, email });
      setMsg(res?.data?.message || res?.message || 'Đăng ký thành công');
    } catch (error) {
      setMsg(error?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {/* Customer low stock warning */}
      {isLowStock && (
        <div style={{ color: '#b45309', fontWeight: 600 }}>
          ⚠ Sắp hết hàng, còn {stock} sản phẩm.
        </div>
      )}

      {/* Out-of-stock: cho đăng ký nhận thông báo */}
      {isOutOfStock && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#dc2626', fontWeight: 600 }}>Hết hàng</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              type="email"
              placeholder="Nhập email nhận thông báo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 8, minWidth: 260 }}
            />
            <button type="button" onClick={onSubscribe}>Đăng ký báo có hàng</button>
          </div>
          {msg && <div style={{ marginTop: 6 }}>{msg}</div>}
        </div>
      )}

      {/* Compare */}
      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={onToggleCompare}>
          {isInCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
        </button>
        <span style={{ marginLeft: 8, fontSize: 13 }}>({compareIds.length}/4)</span>
      </div>

      {/* Bảng compare */}
      {compareData.length >= 2 && (
        <div style={{ marginTop: 12, overflowX: 'auto' }}>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th>Tiêu chí</th>
                {compareData.map((b) => <th key={b._id}>{b.title}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Author</td>
                {compareData.map((b) => <td key={`${b._id}-author`}>{b.author}</td>)}
              </tr>
              <tr>
                <td>Price</td>
                {compareData.map((b) => <td key={`${b._id}-price`}>{b.price}</td>)}
              </tr>
              <tr>
                <td>Rating</td>
                {compareData.map((b) => (
                  <td key={`${b._id}-rating`}>{b.avgRating} ({b.totalReviews})</td>
                ))}
              </tr>
              <tr>
                <td>Stock</td>
                {compareData.map((b) => <td key={`${b._id}-stock`}>{b.stock}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}