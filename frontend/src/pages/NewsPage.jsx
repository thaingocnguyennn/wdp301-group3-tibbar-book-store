import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { newsApi } from "../api/newsApi";

const NewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const serverBaseUrl = useMemo(() => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return api.replace(/\/api\/?$/, "");
  }, []);

  useEffect(() => {
    fetchNews();
  }, [id]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await newsApi.getNewsById(id);
      setNews(response.data.news);
    } catch (err) {
      setError(err.response?.data?.message || "News not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading news...</div>;
  }

  if (error || !news) {
    return (
      <div style={styles.errorWrap}>
        <h2 style={styles.errorTitle}>{error || "News not found"}</h2>
        <button style={styles.backBtn} onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <article style={styles.article}>
        {news.imageUrl && (
          <img
            src={`${serverBaseUrl}${news.imageUrl}`}
            alt={news.title}
            style={styles.image}
          />
        )}
        <div style={styles.meta}>{new Date(news.createdAt).toLocaleDateString()}</div>
        <h1 style={styles.title}>{news.title}</h1>
        <p style={styles.content}>{news.content}</p>
      </article>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2rem",
  },
  article: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  },
  image: {
    width: "100%",
    maxHeight: "460px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "1rem",
  },
  meta: {
    color: "#7f8c8d",
    marginBottom: "0.8rem",
    fontSize: "0.95rem",
  },
  title: {
    margin: "0 0 1rem 0",
    color: "#2c3e50",
    fontSize: "2rem",
  },
  content: {
    margin: 0,
    color: "#34495e",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    color: "#7f8c8d",
  },
  errorWrap: {
    textAlign: "center",
    padding: "3rem",
  },
  errorTitle: {
    color: "#e74c3c",
  },
  backBtn: {
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.7rem 1.2rem",
    cursor: "pointer",
  },
};

export default NewsPage;
