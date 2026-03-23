import { useEffect, useState } from "react";
import { orderApi } from "../../api/orderApi";

const ShipperFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState([]);
    const fetchFeedbacks = async () => {
        console.log("CALL API..."); // 👈 thêm

        try {
            const res = await orderApi.getShipperFeedbacks();
            console.log("RES:", res);

            setFeedbacks(res.data || []);
        } catch (err) {
            console.log("ERROR FULL:", err);
        }
    };
    const fetchStats = async () => {
        try {
            const res = await orderApi.getShipperStats();
            setStats(res.data || []);
        } catch (err) {
            console.log(err);
        }
    };
    useEffect(() => {
        fetchFeedbacks();
        fetchStats();
    }, []);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🚚 Shipper Feedbacks</h2>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Order</th>
                        <th style={styles.th}>Customer</th>
                        <th style={styles.th}>Shipper</th>
                        <th style={styles.th}>Rating</th>
                        <th style={styles.th}>Comment</th>
                    </tr>
                </thead>

                <tbody>
                    {feedbacks.length > 0 ? (
                        feedbacks.map((f, index) => (
                            <tr key={index} style={styles.row}>
                                <td style={styles.td}>{f.orderNumber}</td>
                                <td style={styles.td}>{f.customer}</td>
                                <td style={styles.td}>{f.shipper}</td>
                                <td style={styles.td}>⭐ {f.rating}</td>
                                <td style={styles.td}>{f.comment}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={styles.empty}>
                                No feedback available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <h3 style={styles.statTitle}>📊 Shipper Rating Statistics</h3>

            <table style={styles.statTable}>
                <thead>
                    <tr>
                        <th style={styles.statTh}>Shipper</th>
                        <th style={styles.statTh}>Average Rating</th>
                        <th style={styles.statTh}>Total Reviews</th>
                    </tr>
                </thead>

                <tbody>
                    {stats.map((s, index) => (
                        <tr key={index} style={styles.statRow}>
                            <td style={styles.statTd}>{s.name}</td>
                            <td style={styles.statTd}>⭐ {s.avgRating}</td>
                            <td style={styles.statTd}>{s.totalReviews}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "2rem",
    },
    title: {
        fontSize: "2rem",
        marginBottom: "1.5rem",
        color: "#2c3e50",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "#fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        overflow: "hidden",
    },
    th: {
        backgroundColor: "#4a69bd",
        color: "#fff",
        padding: "12px",
        textAlign: "center",
    },
    td: {
        padding: "12px",
        textAlign: "center",
        borderBottom: "1px solid #eee",
    },
    row: {
        transition: "background 0.2s",
    },
    empty: {
        padding: "20px",
        textAlign: "center",
        color: "#888",
    },
    statTitle: {
        fontSize: "1.8rem",
        fontWeight: "bold",
        marginTop: "40px",
        marginBottom: "10px",
    },

    statTable: {
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "#f5f5f5",
    },

    statTh: {
        border: "2px solid #333",
        padding: "10px",
        backgroundColor: "#e0e0e0",
        fontWeight: "bold",
        textAlign: "center",
    },

    statTd: {
        border: "2px solid #333",
        padding: "10px",
    },

    statRow: {
        backgroundColor: "#fafafa",
    },
};

export default ShipperFeedbackPage;