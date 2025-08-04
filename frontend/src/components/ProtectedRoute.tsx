import { Navigate } from "react-router-dom";

function ProtectedRoute({ user, children }: { user: any, children: JSX.Element }) {
  console.log("🧪 ProtectedRoute 유저 상태:", user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;