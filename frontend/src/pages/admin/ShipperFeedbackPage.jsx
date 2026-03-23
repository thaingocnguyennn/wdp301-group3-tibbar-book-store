import { useEffect, useState } from "react";
import { orderApi } from "../../api/orderApi";

const ShipperFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);

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

    useEffect(() => {
        fetchFeedbacks();
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
};

export default ShipperFeedbackPage;