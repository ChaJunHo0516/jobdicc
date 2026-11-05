import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { StoreProvider } from "./lib/store";
import { SiteLayout } from "./components/layout";
import { HomePage, JobDetailPage, JobsPage, LoginPage, MePage, RolesPage, SignupPage } from "./pages/public";
import { CompanyHome, CompanyLayout, DocPage, LearnPage, ProgressPage, QuizPage } from "./pages/company";
import { AdminAiReview, AdminApplications, AdminDashboard, AdminDocuments, AdminInvites, AdminJobs, AdminMembers } from "./pages/admin";
import { Empty } from "./components/ui";

// GitHub Pages 는 서버 라우팅이 없으므로 새로고침에도 안전한 HashRouter 를 사용한다.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="c/:slug" element={<CompanyLayout />}>
              <Route index element={<CompanyHome />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="learn/:docId" element={<DocPage />} />
              <Route path="quiz/:docId" element={<QuizPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/documents" element={<AdminDocuments />} />
              <Route path="admin/ai" element={<AdminAiReview />} />
              <Route path="admin/members" element={<AdminMembers />} />
              <Route path="admin/invites" element={<AdminInvites />} />
              <Route path="admin/jobs" element={<AdminJobs />} />
              <Route path="admin/applications" element={<AdminApplications />} />
            </Route>
            <Route path="*" element={<Empty>페이지를 찾을 수 없습니다.</Empty>} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
);
