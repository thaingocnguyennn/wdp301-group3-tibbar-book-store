import { useEffect, useMemo, useState } from "react";
import { bookApi } from "../../api/bookApi";
import { flashSaleApi } from "../../api/flashSaleApi";

// Số sách bắt buộc trong mỗi chiến dịch flash sale
const REQUIRED_BOOK_COUNT = 5;

// Hàm tạo danh sách slot trống để trưng bày sách flash sale
const createEmptySlots = (defaultDiscount = 10) =>
  Array.from({ length: REQUIRED_BOOK_COUNT }, () => ({
    bookId: "",
    discountPercent: defaultDiscount,
  }));

// Định dạng thời gian đếm ngược từ milliseconds thành HH:MM:SS
const formatCountdown = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.floor(Number(remainingMs || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
};

// Component: Trang quản lý flash sale cho admin
// Tính năng: Tạo, cập nhật, xóa chiến dịch flash sale
const FlashSaleManagement = () => {
  // State: Danh sách sách (để chọn vào flash sale)
  const [books, setBooks] = useState([]);
  // State: Chiến dịch flash sale hiện tại
  const [campaign, setCampaign] = useState(null);
  // State: Thời gian còn lại của chiến dịch (milliseconds)
  const [remainingMs, setRemainingMs] = useState(0);
  // State: Thời lượng chiến dịch (phút)
  const [durationMinutes, setDurationMinutes] = useState(10);
  // State: Các cài đặt flash sale từ backend
  const [settings, setSettings] = useState({
    minDiscountPercent: 10,
    maxDiscountPercent: 50,
    maxDurationMinutes: 30,
    defaultDurationMinutes: 10,
    requiredBookCount: REQUIRED_BOOK_COUNT,
  });
  // State: Danh sách slot sách flash sale (5 slot)
  const [slots, setSlots] = useState(createEmptySlots(10));
  // State: Lưu trữ trạng thái loading/saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Tính toán danh sách tùy chọn sách để chọn (value + label)
  const bookOptions = useMemo(() => {
    return books.map((book) => ({
      value: book._id,
      label: `${book.title} - ${Number(book.price || 0).toLocaleString("vi-VN")}₫`,
    }));
  }, [books]);

  // Khôi động: Lấy dữ liệu khi tải trang
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Cập nhật bộ đếm ngược thời gian chiến dịch mỗi 1 giây
  useEffect(() => {
    if (!campaign?.endsAt) return undefined;

    setRemainingMs(Math.max(0, new Date(campaign.endsAt).getTime() - Date.now()));

    const intervalId = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [campaign]);

  // Lấy danh sách sách công khai từ backend
  const fetchBooks = async () => {
    const response = await bookApi.getAllBooksAdmin({
      visibility: "public",
      page: 1,
      limit: 100,
    });

    setBooks(response?.data?.books || []);
  };

  // Lấy thông tin chiến dịch flash sale hiện tại từ backend
  const fetchCurrentCampaign = async () => {
    const response = await flashSaleApi.getCurrentFlashSaleAdmin();
    const currentCampaign = response?.data?.campaign || null;
    const currentSettings = response?.data?.settings || {};

    setSettings((prev) => ({ ...prev, ...currentSettings }));
    setCampaign(currentCampaign);

    const defaultDuration =
      currentSettings.defaultDurationMinutes || prevOr(currentCampaign?.remainingMs, 10);
    setDurationMinutes(defaultDuration);

    if (currentCampaign?.books?.length === REQUIRED_BOOK_COUNT) {
      setSlots(
        currentCampaign.books.map((item) => ({
          bookId: item._id,
          discountPercent: item.discountPercent,
        })),
      );
    } else {
      setSlots(
        createEmptySlots(currentSettings.minDiscountPercent || 10),
      );
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([fetchBooks(), fetchCurrentCampaign()]);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load flash sale settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotBookChange = (index, bookId) => {
    setSlots((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, bookId } : slot,
      ),
    );
  };

  const handleSlotDiscountChange = (index, discountPercent) => {
    setSlots((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              discountPercent,
            }
          : slot,
      ),
    );
  };

  const validateBeforeSave = () => {
    const selectedBookIds = slots.map((slot) => slot.bookId).filter(Boolean);

    if (selectedBookIds.length !== REQUIRED_BOOK_COUNT) {
      return `Please select exactly ${REQUIRED_BOOK_COUNT} books for this flash sale`;
    }

    const uniqueBookIds = new Set(selectedBookIds);
    if (uniqueBookIds.size !== REQUIRED_BOOK_COUNT) {
      return "Each slot must contain a different book";
    }

    for (let index = 0; index < slots.length; index += 1) {
      const discountValue = Number(slots[index].discountPercent);
      if (!Number.isInteger(discountValue)) {
        return `Discount at slot ${index + 1} must be an integer`;
      }

      if (
        discountValue < settings.minDiscountPercent ||
        discountValue > settings.maxDiscountPercent
      ) {
        return `Discount at slot ${index + 1} must be between ${settings.minDiscountPercent}% and ${settings.maxDiscountPercent}%`;
      }
    }

    const durationValue = Number(durationMinutes);
    if (!Number.isInteger(durationValue) || durationValue < 1) {
      return "Duration must be an integer greater than 0";
    }

    if (durationValue > settings.maxDurationMinutes) {
      return `Duration cannot exceed ${settings.maxDurationMinutes} minutes`;
    }

    return null;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateBeforeSave();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        durationMinutes: Number(durationMinutes),
        books: slots.map((slot) => ({
          bookId: slot.bookId,
          discountPercent: Number(slot.discountPercent),
        })),
      };

      const response = await flashSaleApi.upsertCurrentFlashSale(payload);
      setCampaign(response?.data?.campaign || null);
      setMessage("Flash sale saved successfully");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save flash sale");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear current flash sale campaign?")) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");
      await flashSaleApi.clearCurrentFlashSale();
      setCampaign(null);
      setRemainingMs(0);
      setSlots(createEmptySlots(settings.minDiscountPercent));
      setMessage("Flash sale cleared");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to clear flash sale");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Flash Sale Management</h1>
        <div style={styles.loading}>Loading flash sale data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Flash Sale Management</h1>

      <div style={styles.summaryCard}>
        <h3 style={styles.summaryTitle}>Current Campaign</h3>
        {campaign ? (
          <>
            <p style={styles.summaryText}>
              {campaign.books.length} books selected
            </p>
            <p style={styles.countdown}>⏳ Remaining: {formatCountdown(remainingMs)}</p>
            <p style={styles.summaryTextSmall}>
              Ends at: {new Date(campaign.endsAt).toLocaleString()}
            </p>
          </>
        ) : (
          <p style={styles.summaryText}>No active flash sale campaign</p>
        )}
      </div>

      {(message || error) && (
        <div
          style={{
            ...styles.alert,
            ...(error ? styles.alertError : styles.alertSuccess),
          }}
        >
          {error || message}
        </div>
      )}

      <form onSubmit={handleSave} style={styles.formCard}>
        <div style={styles.formRow}>
          <label style={styles.label}>Campaign Duration (minutes)</label>
          <input
            type="number"
            min={1}
            max={settings.maxDurationMinutes}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            style={styles.input}
          />
          <span style={styles.helper}>
            Max {settings.maxDurationMinutes} minutes
          </span>
        </div>

        <div style={styles.slotsGrid}>
          {slots.map((slot, index) => (
            <div key={`slot-${index + 1}`} style={styles.slotCard}>
              <h4 style={styles.slotTitle}>Slot {index + 1}</h4>
              <label style={styles.fieldLabel}>Book</label>
              <select
                value={slot.bookId}
                onChange={(event) => handleSlotBookChange(index, event.target.value)}
                style={styles.select}
              >
                <option value="">Select a book</option>
                {bookOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label style={styles.fieldLabel}>Discount (%)</label>
              <input
                type="number"
                min={settings.minDiscountPercent}
                max={settings.maxDiscountPercent}
                value={slot.discountPercent}
                onChange={(event) =>
                  handleSlotDiscountChange(index, event.target.value)
                }
                style={styles.input}
              />
            </div>
          ))}
        </div>

        <div style={styles.actionRow}>
          <button type="submit" style={styles.saveButton} disabled={saving}>
            {saving ? "Saving..." : "Save Flash Sale"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={styles.clearButton}
            disabled={saving}
          >
            Clear Current Campaign
          </button>
        </div>
      </form>
    </div>
  );
};

function prevOr(remainingMs, fallback) {
  if (!remainingMs || Number(remainingMs) <= 0) return fallback;
  return Math.max(1, Math.ceil(Number(remainingMs) / (1000 * 60)));
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  title: {
    fontSize: "2.2rem",
    color: "#1f2a44",
    marginBottom: "1.5rem",
  },
  loading: {
    background: "#fff",
    padding: "1rem 1.25rem",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },
  summaryCard: {
    background: "linear-gradient(135deg, #ff6b6b 0%, #ff3f5e 100%)",
    color: "#fff",
    borderRadius: "14px",
    padding: "1.25rem 1.4rem",
    marginBottom: "1rem",
    boxShadow: "0 8px 24px rgba(255, 63, 94, 0.3)",
  },
  summaryTitle: {
    margin: "0 0 0.45rem",
    fontSize: "1.15rem",
    fontWeight: 700,
  },
  summaryText: {
    margin: 0,
    fontSize: "1rem",
  },
  summaryTextSmall: {
    margin: "0.3rem 0 0",
    fontSize: "0.9rem",
    opacity: 0.9,
  },
  countdown: {
    margin: "0.45rem 0 0",
    fontSize: "1.08rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  alert: {
    borderRadius: "10px",
    padding: "0.85rem 1rem",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  alertSuccess: {
    backgroundColor: "#ebf9ef",
    color: "#126c3f",
    border: "1px solid #bce7ca",
  },
  alertError: {
    backgroundColor: "#fff1f0",
    color: "#a41316",
    border: "1px solid #ffccc7",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "1.35rem",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    marginBottom: "1rem",
  },
  label: {
    fontWeight: 700,
    color: "#1f2a44",
  },
  helper: {
    color: "#64748b",
    fontSize: "0.9rem",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.9rem",
  },
  slotCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0.9rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },
  slotTitle: {
    margin: 0,
    color: "#1f2a44",
    fontSize: "1rem",
  },
  fieldLabel: {
    fontSize: "0.84rem",
    color: "#475569",
    fontWeight: 600,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.55rem 0.7rem",
    fontSize: "0.95rem",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.55rem 0.7rem",
    fontSize: "0.92rem",
    backgroundColor: "#fff",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.7rem",
    marginTop: "1.2rem",
  },
  saveButton: {
    border: "none",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    borderRadius: "10px",
    padding: "0.66rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  clearButton: {
    border: "1px solid #ef4444",
    background: "#fff",
    color: "#ef4444",
    borderRadius: "10px",
    padding: "0.66rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default FlashSaleManagement;
