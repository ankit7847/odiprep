import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import RequireAuth from "./components/layout/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Exams from "./pages/Exams";
import ExamDetail from "./pages/ExamDetail";
import TestIntro from "./pages/TestIntro";
import ExamScreen from "./pages/ExamScreen";
import Result from "./pages/Result";
import Dashboard from "./pages/Dashboard";
import RequireAdmin from "./components/layout/RequireAdmin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminQuestions from "./pages/admin/Questions";
import QuestionForm from "./pages/admin/QuestionForm";
import AdminUpload from "./pages/admin/Upload";
import AdminTests from "./pages/admin/Tests";
import TestEditor from "./pages/admin/TestEditor";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Full-screen exam, no site header/footer */}
      <Route
        path="attempt/:id"
        element={
          <RequireAuth>
            <ExamScreen />
          </RequireAuth>
        }
      />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route path="exams" element={<Exams />} />
        <Route path="exams/:slug" element={<ExamDetail />} />
        <Route path="pyq" element={<Exams title="PYQ Papers" subtitle="Pick your exam to see previous-year papers, in order." />} />
        <Route path="mock-tests" element={<Exams title="Mock Tests" subtitle="Pick your exam to take a full timed mock." />} />
        <Route path="test/:slug" element={<TestIntro />} />
        <Route
          path="attempt/:id/result"
          element={
            <RequireAuth>
              <Result />
            </RequireAuth>
          }
        />

        {/* Next pages */}
        <Route path="daily-quiz" element={<ComingSoon title="Daily Quiz" />} />
        <Route path="forgot-password" element={<ComingSoon title="Reset your password" />} />
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="questions/new" element={<QuestionForm key="new" />} />
          <Route path="questions/:id" element={<QuestionForm key="edit" />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="tests/new" element={<TestEditor key="new" />} />
          <Route path="tests/:id" element={<TestEditor key="edit" />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
