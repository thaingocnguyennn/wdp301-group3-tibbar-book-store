import { useEffect, useMemo, useState } from "react";
import { newsApi } from "../../api/newsApi";

const NewsManagement = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingNews, setEditingNews] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const serverBaseUrl = useMemo(() => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return api.replace(/\/api\/?$/, "");
  }, []);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await newsApi.getAllNewsAdmin();
      setNewsList(response.data.news || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "" });
    setSelectedFile(null);
    setEditingNews(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("content", formData.content);

    if (selectedFile) {
      payload.append("image", selectedFile);
    }

    try {
      if (editingNews) {
        await newsApi.updateNews(editingNews._id, payload);
        setMessage("News updated successfully");
      } else {
        await newsApi.createNews(payload);
        setMessage("News created successfully");
      }

      resetForm();
      fetchNews();
    } catch (error) {
      setMessage(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (news) => {
    setEditingNews(news);
    setFormData({
      title: news.title || "",
      content: news.content || "",
    });
    setSelectedFile(null);
  };

  const handleDelete = async (news) => {
    if (!window.confirm("Delete this news article?")) return;

    try {
      await newsApi.deleteNews(news._id);
      setMessage("News deleted");
      fetchNews();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>News Management</h1>

      {message && <div style={styles.message}>{message}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={styles.formTitle}>{editingNews ? "Update News" : "Create News"}</h3>

        <input
          type="text"
          placeholder="News title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          style={styles.input}
        />

        <textarea
          placeholder="News content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          required
          style={styles.textarea}
        />

        <div style={styles.formRow}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={styles.input}
          />
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.submitBtn}>
            {editingNews ? "Update News" : "Create News"}
          </button>
          {editingNews && (
            <button type="button" onClick={resetForm} style={styles.cancelBtn}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={styles.listWrap}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : newsList.length === 0 ? (
          <div style={styles.empty}>No news yet</div>
        ) : (
          <div style={styles.grid}>
            {newsList.map((news) => (
              <div key={news._id} style={styles.card}>
                {news.imageUrl ? (
                  <img src={`${serverBaseUrl}${news.imageUrl}`} alt={news.title} style={styles.cardImage} />
                ) : (
                  <div style={styles.placeholder}>📰</div>
                )}
                <div style={styles.cardBody}>
                  <h4 style={styles.cardTitle}>{news.title}</h4>
                  <p style={styles.cardMeta}>Created: {new Date(news.createdAt).toLocaleDateString()}</p>
                  <p style={styles.cardMeta}>Updated: {new Date(news.updatedAt).toLocaleDateString()}</p>
                  <div style={styles.cardActions}>
                    <button style={styles.editBtn} onClick={() => handleEdit(news)}>Edit</button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(news)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "2rem" },
  title: { fontSize: "2rem", color: "#2c3e50", marginBottom: "1rem" },
  message: { backgroundColor: "#d4edda", color: "#155724", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem" },
  form: { backgroundColor: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "1.5rem" },
  formTitle: { marginTop: 0, color: "#2c3e50" },
  input: { width: "100%", padding: "0.7rem", border: "1px solid #ddd", borderRadius: "6px", marginBottom: "0.8rem" },
  textarea: { width: "100%", padding: "0.7rem", border: "1px solid #ddd", borderRadius: "6px", marginBottom: "0.8rem", fontFamily: "inherit" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center", marginBottom: "0.8rem" },
  actions: { display: "flex", gap: "0.7rem" },
  submitBtn: { border: "none", backgroundColor: "#3498db", color: "#fff", borderRadius: "6px", padding: "0.6rem 1.2rem", cursor: "pointer" },
  cancelBtn: { border: "none", backgroundColor: "#95a5a6", color: "#fff", borderRadius: "6px", padding: "0.6rem 1.2rem", cursor: "pointer" },
  listWrap: { marginTop: "1rem" },
  loading: { textAlign: "center", color: "#7f8c8d" },
  empty: { textAlign: "center", color: "#7f8c8d" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" },
  card: { backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 3px 10px rgba(0,0,0,0.1)", overflow: "hidden" },
  cardImage: { width: "100%", height: "150px", objectFit: "cover" },
  placeholder: { height: "150px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#bdc3c7", backgroundColor: "#f8f9fa" },
  cardBody: { padding: "0.8rem" },
  cardTitle: { margin: "0 0 0.4rem 0", color: "#2c3e50" },
  cardMeta: { margin: "0 0 0.3rem 0", color: "#7f8c8d", fontSize: "0.9rem" },
  cardActions: { display: "flex", gap: "0.6rem" },
  editBtn: { border: "none", backgroundColor: "#667eea", color: "#fff", borderRadius: "5px", padding: "0.45rem 0.8rem", cursor: "pointer" },
  deleteBtn: { border: "none", backgroundColor: "#e74c3c", color: "#fff", borderRadius: "5px", padding: "0.45rem 0.8rem", cursor: "pointer" },
};

export default NewsManagement;
