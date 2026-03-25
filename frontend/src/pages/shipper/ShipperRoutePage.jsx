import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // 👈 thêm
import { shipperApi } from "../../api/shipperApi";

const ShipperRoutePage = () => {
  const { orderId } = useParams(); // 👈 lấy orderId từ route
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        // 👇 truyền orderId vào API
        const data = await shipperApi.getRoute(orderId);
        setRoute(data.route || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchRoute(); // chỉ fetch khi orderId có
  }, [orderId]);

  if (loading) return <p>Loading route...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Shipper Route</h1>
      {route.length === 0 ? (
        <p>No active orders to plan route.</p>
      ) : (
        <ol className="list-decimal ml-6">
          {route.map((point, idx) => (
            <li key={point.orderId}>
              {point.address} - ETA: {Math.round(point.etaMinutes)} min
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default ShipperRoutePage;