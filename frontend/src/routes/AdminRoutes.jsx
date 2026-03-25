import React from "react";
import { Route, Routes } from "react-router-dom";
import InventoryManagementPage from "../pages/admin/InventoryManagementPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/inventory" element={<InventoryManagementPage />} />
    </Routes>
  );
};

export default AppRoutes;