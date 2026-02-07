import { useEffect, useState } from "react";
import axios from "../../api/axios";

const AdminRevenue = () => {
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [range, setRange] = useState("all");

  useEffect(() => {
    fetchRevenue();
  }, [range]);

  const fetchRevenue = async () => {
    try {
      const res = await axios.get(`/orders/admin/revenue?range=${range}`);
      setRevenue(res.data.totalRevenue);
      setOrdersCount(res.data.totalOrders);
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Revenue Statistics</h1>

      <div style={styles.filter}>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Revenue</h3>
          <p style={styles.bigNumber}>
            {revenue.toLocaleString()} ₫
          </p>
        </div>

        <div style={styles.card}>
          <h3>Completed Orders</h3>
          <p style={styles.bigNumber}>
            {ordersCount}
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "2rem",
  },
  filter: {
    marginBottom: "2rem",
  },
  select: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  cards: {
    display: "flex",
    gap: "2rem",
  },
  card: {
    flex: 1,
    background: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  bigNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#27ae60",
  },
};

export default AdminRevenue;
