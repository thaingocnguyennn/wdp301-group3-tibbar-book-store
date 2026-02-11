import { useEffect, useState } from "react";
import axios from "../../api/axios";

const AdminShippers = () => {
  const [shippers, setShippers] = useState([]);

  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = async () => {
    try {
      const res = await axios.get("/users/admin/shippers");
      setShippers(res.data.shippers || []);
    } catch (error) {
      console.error("Error fetching shippers:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚚 Shippers Management</h1>

      <div style={styles.tableWrapper}>
        {shippers.length === 0 ? (
          <div style={styles.empty}>No shipper accounts found</div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Assigned Orders</th>
                <th style={styles.th}>Created At</th>
              </tr>
            </thead>

            <tbody>
              {shippers.map((shipper) => (
                <tr key={shipper._id}>
                  <td style={styles.td}>{shipper.email}</td>

                  <td style={{ ...styles.td, ...styles.role }}>
                    {shipper.role}
                  </td>

                  <td style={styles.td}>
                    {shipper.assignedOrders}
                  </td>

                  <td style={styles.td}>
                    {new Date(shipper.createdAt).toLocaleDateString()}
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

  role: {
    fontWeight: "600",
    color: "#27ae60",
  },

  empty: {
    padding: "2rem",
    textAlign: "center",
    color: "#888",
  },
};

export default AdminShippers;
