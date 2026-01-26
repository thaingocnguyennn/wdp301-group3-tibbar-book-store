import { useEffect, useMemo, useState } from "react";
import { sliderApi } from "../../api/sliderApi";

const SlidersManagement = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    visibility: "public",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingSlider, setEditingSlider] = useState(null);

  const serverBaseUrl = useMemo(() => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return api.replace(/\/api\/?$/, "");
  }, []);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      const res = await sliderApi.getAllSlidersAdmin();
      setSliders(res.data.sliders || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load sliders");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      visibility: "public",
    });
    setSelectedFile(null);
    setEditingSlider(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const payload = new FormData();
    if (selectedFile) {
      payload.append("image", selectedFile);
    }
    payload.append("visibility", formData.visibility);

    try {
      if (editingSlider) {
        await sliderApi.updateSlider(editingSlider._id, payload);
        setMessage("Slider updated successfully");
      } else {
        await sliderApi.createSlider(payload);
        setMessage("Slider created successfully");
      }
      resetForm();
      fetchSliders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (slider) => {
    setEditingSlider(slider);
    setFormData({
      visibility: slider.visibility || "public",
    });
    setSelectedFile(null);
  };

  const toggleVisibility = async (slider) => {
    try {
      const newVisibility =
        slider.visibility === "public" ? "hidden" : "public";
      await sliderApi.updateVisibility(slider._id, newVisibility);
      fetchSliders();
    } catch (error) {
      setMessage("Failed to update visibility");
    }
  };

  const handleDelete = async (slider) => {
    if (!window.confirm("Delete this slider?")) return;

    try {
      await sliderApi.deleteSlider(slider._id);
      setMessage("Slider deleted");
      fetchSliders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Slider Management</h1>
        <span style={styles.badge}>Max 5 images</span>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={styles.formTitle}>
          {editingSlider ? "Update Slider" : "Add New Slider"}
        </h3>
        <div style={styles.formRow}>
          <select
            value={formData.visibility}
            onChange={(e) =>
              setFormData({ ...formData, visibility: e.target.value })
            }
            style={styles.input}
          >
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={styles.input}
          />
        </div>
        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton}>
            {editingSlider ? "Update Slider" : "Create Slider"}
          </button>
          {editingSlider && (
            <button
              type="button"
              style={styles.cancelButton}
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : sliders.length === 0 ? (
          <div style={styles.empty}>No sliders yet</div>
        ) : (
          sliders.map((slider) => (
            <div key={slider._id} style={styles.card}>
              <div style={styles.cardImageWrapper}>
                {slider.imageUrl ? (
                  <img
                    src={`${serverBaseUrl}${slider.imageUrl}`}
                    alt={slider.title || "slider"}
                    style={styles.cardImage}
                  />
                ) : (
                  <div style={styles.cardPlaceholder}>🖼️</div>
                )}
              </div>
              <div style={styles.cardContent}>
                <div style={styles.cardActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => handleEdit(slider)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.visibilityBtn}
                    onClick={() => toggleVisibility(slider)}
                  >
                    {slider.visibility === "public" ? "Hide" : "Show"}
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(slider)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    color: "#2c3e50",
  },
  badge: {
    backgroundColor: "#f1f2f6",
    padding: "0.4rem 0.9rem",
    borderRadius: "999px",
    color: "#7f8c8d",
  },
  message: {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "1rem",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  form: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  formTitle: {
    marginBottom: "1rem",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
    width: "100%",
  },
  formActions: {
    display: "flex",
    gap: "1rem",
  },
  submitButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "0.75rem 2rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    color: "#fff",
    padding: "0.75rem 2rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  cardImageWrapper: {
    height: "160px",
    backgroundColor: "#f1f2f6",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardPlaceholder: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.2rem",
    color: "#bdc3c7",
  },
  cardContent: {
    padding: "1rem",
  },
  cardActions: {
    display: "flex",
    gap: "0.75rem",
  },
  editBtn: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  visibilityBtn: {
    backgroundColor: "#fff",
    color: "#667eea",
    border: "1px solid #667eea",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  loading: {
    textAlign: "center",
    color: "#7f8c8d",
  },
  empty: {
    textAlign: "center",
    color: "#7f8c8d",
  },
};

export default SlidersManagement;
