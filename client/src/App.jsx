import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import RequireAuth from "./components/layout/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Next pages */}
        <Route path="exams" element={<ComingSoon title="All exams" />} />
        <Route path="exams/:slug" element={<ComingSoon title="Exam papers" />} />
        <Route path="pyq" element={<ComingSoon title="PYQ Papers" />} />
        <Route path="mock-tests" element={<ComingSoon title="Mock Tests" />} />
        <Route path="daily-quiz" element={<ComingSoon title="Daily Quiz" />} />
        <Route path="forgot-password" element={<ComingSoon title="Reset your password" />} />
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <ComingSoon title="Your dashboard" />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
