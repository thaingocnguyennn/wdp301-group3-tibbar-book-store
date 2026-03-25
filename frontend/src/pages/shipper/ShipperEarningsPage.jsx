import React, { useEffect, useState } from "react";
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { shipperApi } from "../../api/shipperApi";

const ShipperEarningsPage = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const data = await shipperApi.getEarnings();
        setEarningsData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching earnings");
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <h1>Shipper Earnings Dashboard</h1>

      <div className="cards">
        <div className="card card-earnings">
          <FaMoneyBillWave className="icon" />
          <div>
            <p>Total Earnings</p>
            <p className="value">
              {earningsData.earnings?.toLocaleString() || 0} VND
            </p>
          </div>
        </div>

        <div className="card card-delivered">
          <FaCheckCircle className="icon" />
          <div>
            <p>Delivered Orders</p>
            <p className="value">{earningsData.totalDelivered || 0}</p>
          </div>
        </div>

        <div className="card card-cancelled">
          <FaTimesCircle className="icon" />
          <div>
            <p>Cancelled Orders</p>
            <p className="value">{earningsData.totalCancelled || 0}</p>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        h1 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 30px;
          color: #333;
        }
        .cards {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 40px;
          justify-content: center;
        }
        .card {
          flex: 1 1 250px;
          display: flex;
          align-items: center;
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .card:hover {
          transform: translateY(-5px);
        }
        .card .icon {
          font-size: 2.5rem;
          margin-right: 15px;
        }
        .card-earnings .icon { color: #28a745; }
        .card-delivered .icon { color: #007bff; }
        .card-cancelled .icon { color: #dc3545; }

        .card p {
          margin: 0;
          font-weight: 500;
          color: #555;
        }
        .card .value {
          font-size: 1.8rem;
          font-weight: bold;
          margin-top: 5px;
        }

        .loading, .error {
          text-align: center;
          font-size: 1.2rem;
          margin-top: 80px;
        }
        .error { color: #dc3545; }
      `}</style>
    </div>
  );
};

export default ShipperEarningsPage;