import { useState, useEffect } from "react";
import { sliderApi } from "../../api/sliderApi";
import { bookApi } from "../../api/bookApi";

/**
 * SlidersManagement - Admin page để quản lý sliders
 */
const SlidersManagement = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({
    bookId: "",
  });

  const maxSliders = 5;

  useEffect(() => {
    fetchSliders();
    fetchBooks();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const response = await sliderApi.getAllSliders();
      setSliders(response.data.sliders);
    } catch (error) {
      console.error("Failed to fetch sliders:", error);
      alert("Failed to load sliders");
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await bookApi.getAllBooksAdmin();
      setBooks(response.data.books || []);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bookId) {
      alert("Please select a book");
      return;
    }

    if (!editingSlider && sliders.length >= maxSliders) {
      alert(`You can only add up to ${maxSliders} sliders`);
      return;
    }

    try {
      if (editingSlider) {
        await sliderApi.updateSlider(editingSlider._id, formData);
        alert("Slider updated successfully!");
      } else {
        await sliderApi.createSlider(formData);
        alert("Slider created successfully!");
      }

      setShowForm(false);
      setEditingSlider(null);
      resetForm();
      fetchSliders();
    } catch (error) {
      console.error("Failed to save slider:", error);
      alert(error.response?.data?.message || "Failed to save slider");
    }
  };

  const handleEdit = (slider) => {
    setEditingSlider(slider);
    setFormData({
      bookId: slider.bookId?._id || "",
    });
    setShowForm(true);
  };

  const handleToggleVisibility = async (slider) => {
    const newVisibility =
      slider.visibility === "visible" ? "hidden" : "visible";

    try {
      await sliderApi.toggleVisibility(slider._id, newVisibility);
      fetchSliders();
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      alert("Failed to update visibility");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this slider?")) return;

    try {
      await sliderApi.deleteSlider(id);
      alert("Slider deleted successfully!");
      fetchSliders();
    } catch (error) {
      console.error("Failed to delete slider:", error);
      alert("Failed to delete slider");
    }
  };

  const resetForm = () => {
    setFormData({
      bookId: "",
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSlider(null);
    resetForm();
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Sliders Management</h1>
        <button
          onClick={() => setShowForm(true)}
          style={styles.addButton}
          disabled={sliders.length >= maxSliders}
        >
          + Add New Slider
        </button>
      </div>

      {sliders.length >= maxSliders && (
        <p style={styles.limitNote}>
          Maximum {maxSliders} sliders. Please delete one to add more.
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div style={styles.formContainer}>
          <h2>{editingSlider ? "Edit Slider" : "Create New Slider"}</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Book *</label>
              <select
                value={formData.bookId}
                onChange={(e) =>
                  setFormData({ ...formData, bookId: e.target.value })
                }
                required
                style={styles.select}
              >
                <option value="">-- Choose a book --</option>
                {books.map((book) => (
                  <option key={book._id} value={book._id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>

            {formData.bookId && (
              <div style={styles.preview}>
                <span style={styles.previewLabel}>Preview</span>
                <img
                  src={
                    books.find((b) => b._id === formData.bookId)?.imageUrl ||
                    "https://via.placeholder.com/1200x400?text=Book+Slider"
                  }
                  alt="Preview"
                  style={styles.previewImage}
                />
                <p style={styles.previewText}>
                  {books.find((b) => b._id === formData.bookId)?.description ||
                    "No description"}
                </p>
              </div>
            )}

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitButton}>
                {editingSlider ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sliders List */}
      <div style={styles.list}>
        {sliders.length === 0 ? (
          <p>No sliders found. Create your first slider!</p>
        ) : (
          sliders.map((slider) => (
            <div key={slider._id} style={styles.card}>
              <img
                src={slider.imageUrl}
                alt="Slider"
                style={styles.cardImage}
              />
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    {slider.bookId?.title || "Slider"}
                  </h3>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor:
                        slider.visibility === "visible" ? "#27ae60" : "#95a5a6",
                    }}
                  >
                    {slider.visibility}
                  </span>
                </div>
                <p style={styles.cardDescription}>{slider.description}</p>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(slider)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(slider)}
                    style={styles.toggleButton}
                  >
                    {slider.visibility === "visible" ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => handleDelete(slider._id)}
                    style={styles.deleteButton}
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
    padding: "2rem",
  },
  loading: {
    textAlign: "center",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  addButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  limitNote: {
    marginBottom: "1rem",
    color: "#e67e22",
  },
  formContainer: {
    backgroundColor: "#f9f9f9",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  form: {
    maxWidth: "800px",
  },
  formGroup: {
    marginBottom: "1.5rem",
    flex: 1,
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "bold",
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
    backgroundColor: "#fff",
  },
  preview: {
    marginBottom: "1.5rem",
    border: "1px solid #eee",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  previewLabel: {
    display: "block",
    padding: "0.75rem 1rem",
    fontWeight: "bold",
    borderBottom: "1px solid #eee",
  },
  previewImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
  },
  previewText: {
    margin: 0,
    padding: "1rem",
    color: "#555",
  },
  formActions: {
    display: "flex",
    gap: "1rem",
  },
  submitButton: {
    padding: "0.75rem 2rem",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  cancelButton: {
    padding: "0.75rem 2rem",
    backgroundColor: "#95a5a6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
  },
  cardContent: {
    padding: "1.5rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: "0.5rem",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.25rem",
  },
  badge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "0.875rem",
    textTransform: "capitalize",
  },
  cardDescription: {
    color: "#666",
    marginBottom: "1rem",
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
  },
  editButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  toggleButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#f39c12",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default SlidersManagement;
