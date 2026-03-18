import { useEffect, useState } from "react";
import axios from "../../api/axios";

const AdminWishlist = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/wishlist/admin/stats");
      setStats(res.data.stats || []);
    } catch (error) {
      console.error("Error fetching wishlist stats:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>❤️ Wishlist Statistics</h1>

      <div style={styles.tableWrapper}>
        {stats.length === 0 ? (
          <div style={styles.empty}>No wishlist data yet</div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Book</th>
                <th style={styles.th}>Author</th>
                <th style={styles.th}>Wish Count</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((item, index) => ( //render bảng
                <tr key={item.bookId}>
                  <td style={styles.td}>
                    {index === 0 && (
                      <span style={styles.topBadge}>🔥 Top</span>
                    )}
                    {item.title}
                  </td>
                  <td style={styles.td}>{item.author}</td>
                  <td style={{ ...styles.td, ...styles.count }}>
                    {item.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#2c3e50",
  },

  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  thead: {
    backgroundColor: "#f8f9fa",
  },

  th: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "600",
    borderBottom: "1px solid #eee",
  },

  td: {
    padding: "16px",
    borderBottom: "1px solid #f1f1f1",
  },

  count: {
    fontWeight: "700",
    color: "#e74c3c",
  },

  empty: {
    padding: "2rem",
    textAlign: "center",
    color: "#888",
  },

  topBadge: {
    backgroundColor: "#ffeaa7",
    color: "#d35400",
    fontSize: "0.75rem",
    padding: "3px 6px",
    borderRadius: "6px",
    marginRight: "8px",
    fontWeight: "600",
  },
};

export default AdminWishlist;
