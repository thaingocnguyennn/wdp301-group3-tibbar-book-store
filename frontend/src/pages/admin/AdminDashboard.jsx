import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      <div style={styles.grid}>
        <Link to="/admin/books" style={styles.card}>
          <div style={styles.icon}>📚</div>
          <h3 style={styles.cardTitle}>Books Management</h3>
          <p style={styles.cardDesc}>
            Create, update, and manage all books in the store
          </p>
        </Link>

        <Link to="/admin/categories" style={styles.card}>
          <div style={styles.icon}>🏷️</div>
          <h3 style={styles.cardTitle}>Categories</h3>
          <p style={styles.cardDesc}>
            Manage book categories and classifications
          </p>
        </Link>

        <Link to="/admin/sliders" style={styles.card}>
          <div style={styles.icon}>🖼️</div>
          <h3 style={styles.cardTitle}>Sliders</h3>
          <p style={styles.cardDesc}>
            Manage homepage slider images and visibility
          </p>
        </Link>

        <Link to="/admin/users" style={styles.card}>
          <div style={styles.icon}>👥</div>
          <h3 style={styles.cardTitle}>Users</h3>
          <p style={styles.cardDesc}>Manage user accounts and roles</p>
        </Link>
        <Link to="/admin/wishlist" style={styles.card}>
          <div style={styles.icon}>❤️</div>
          <h3 style={styles.cardTitle}>Wishlist Statistics</h3>
          <p style={styles.cardDesc}>View most wishlisted books</p>
        </Link>
        <Link to="/admin/shippers" style={styles.card}>
          <div style={styles.icon}>🚚</div>
          <h3 style={styles.cardTitle}>Shippers</h3>
          <p style={styles.cardDesc}>View shipers in system</p>
        </Link>
        <Link to="/admin/revenue" style={styles.card}>
          <div style={styles.icon}>📊</div>
          <h3 style={styles.cardTitle}>Revenue Statistics</h3>
          <p style={styles.cardDesc}>
            Analyze sales performance and revenue reports
          </p>
        </Link>

        <Link to="/admin/orders" style={styles.card}>
          <div style={styles.icon}>📦</div>
          <h3 style={styles.cardTitle}>Orders</h3>
          <p style={styles.cardDesc}>View and manage customer orders</p>
        </Link>

        <Link to="/admin/vouchers" style={styles.card}>
          <div style={styles.icon}>🎟️</div>
          <h3 style={styles.cardTitle}>Vouchers</h3>
          <p style={styles.cardDesc}>
            View, create and update voucher campaigns
          </p>
        </Link>

        <Link to="/admin/news" style={styles.card}>
          <div style={styles.icon}>📰</div>
          <h3 style={styles.cardTitle}>News Management</h3>
          <p style={styles.cardDesc}>
            Create and manage news articles shown on homepage
          </p>
        </Link>

        <Link to="/admin/request-history" style={styles.card}>
          <div style={styles.icon}>🕘</div>
          <h3 style={styles.cardTitle}>Recent Request History</h3>
          <p style={styles.cardDesc}>
            Review recent return and refund requests from customers
          </p>
        </Link>
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
  title: {
    fontSize: "2.5rem",
    color: "#2c3e50",
    marginBottom: "2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    textDecoration: "none",
    color: "inherit",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
    },
  },
  icon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.5rem",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  cardDesc: {
    color: "#7f8c8d",
    lineHeight: "1.5",
  },
};

export default AdminDashboard;
