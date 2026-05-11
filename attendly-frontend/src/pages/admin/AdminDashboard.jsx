import { Outlet } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminDashboard;
