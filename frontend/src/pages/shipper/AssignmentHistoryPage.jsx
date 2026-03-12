import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";

const AssignmentHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get("/shipper/assignment-history");
      setOrders(res.data.data.orders || []);
    } catch (err) {
      console.error("Error fetching assignment history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto" }}>
      <h2>📦 Assignment History</h2>

      {orders.length === 0 && <p>No assignments yet.</p>}

      {orders.map((order) => {
        const history = (order.assignmentHistory || []).filter(
          (item) => item.shipper?.toString() === user._id
        );

        return (
          <div
            key={order._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h4>Order #{order.orderNumber}</h4>

            {history.length === 0 && <p>No history</p>}

            {history.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: 10,
                  marginBottom: 10,
                  background:
                    item.status === "ACCEPTED"
                      ? "#e6ffed"
                      : item.status === "REJECTED"
                        ? "#ffe6e6"
                        : "#f4f4f4",
                  borderRadius: 6,
                }}
              >
                <p>
                  <strong>Status:</strong> {item.status}
                </p>

                <p>
                  <strong>Assigned At:</strong>{" "}
                  {new Date(item.assignedAt).toLocaleString()}
                </p>

                {item.respondedAt && (
                  <p>
                    <strong>Responded At:</strong>{" "}
                    {new Date(item.respondedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentHistoryPage;