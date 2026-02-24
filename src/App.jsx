import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";

import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Result        from "./pages/Result";
import History       from "./pages/History";
import Dashboard     from "./pages/Dashboard";
import Schedules     from "./pages/Schedules";
import Share         from "./pages/Share";
import Trends        from "./pages/Trends";        // Phase 4
import Diff          from "./pages/Diff";          // Phase 4
import Teams         from "./pages/Teams";         // Phase 5
import SlackSettings from "./pages/SlackSettings"; // Phase 5
import ApiKeys       from "./pages/ApiKeys";       // Phase 6a
import BulkTest      from "./pages/BulkTest";      // Phase 6b
import WhiteLabel    from "./pages/WhiteLabel";    // Phase 6c
import Analytics     from "./pages/Analytics";     // Phase 6d
// Phase 7A
import RoleManagement    from "./pages/RoleManagement";
import NotificationRules from "./pages/NotificationRules";
import Templates         from "./pages/Templates";
import Monitoring        from "./pages/Monitoring";
// Phase 7B
import Reporting         from "./pages/Reporting";
import Billing           from "./pages/Billing";
import Compliance        from "./pages/Compliance";
import DevTools          from "./pages/DevTools";
// Phase 8A
import AI                from "./pages/AI";
// Phase 8B
import ActivityFeed      from "./pages/ActivityFeed";
// Phase 8C
import CICDSettings      from "./pages/CICDSettings";
import CICDTriggers      from "./pages/CICDTriggers";
// Phase 8E
import OpenAPIImport     from "./pages/OpenAPIImport";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"        element={<Login />} />
          <Route path="/share/:token" element={<Share />} />

          {/* Protected */}
          <Route path="/"            element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/result/:testId"  element={<PrivateRoute><Result /></PrivateRoute>} />
          <Route path="/history"     element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/schedules"   element={<PrivateRoute><Schedules /></PrivateRoute>} />
          <Route path="/trends"      element={<PrivateRoute><Trends /></PrivateRoute>} />
          <Route path="/diff"        element={<PrivateRoute><Diff /></PrivateRoute>} />
          <Route path="/teams"       element={<PrivateRoute><Teams /></PrivateRoute>} />
          <Route path="/slack"       element={<PrivateRoute><SlackSettings /></PrivateRoute>} />
          <Route path="/apikeys"     element={<PrivateRoute><ApiKeys /></PrivateRoute>} />
          <Route path="/bulk"        element={<PrivateRoute><BulkTest /></PrivateRoute>} />
          <Route path="/whitelabel"  element={<PrivateRoute><WhiteLabel /></PrivateRoute>} />
          <Route path="/analytics"   element={<PrivateRoute><Analytics /></PrivateRoute>} />

          {/* Phase 7A */}
          <Route path="/roles"         element={<PrivateRoute><RoleManagement /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationRules /></PrivateRoute>} />
          <Route path="/templates"     element={<PrivateRoute><Templates /></PrivateRoute>} />
          <Route path="/monitoring"    element={<PrivateRoute><Monitoring /></PrivateRoute>} />

          {/* Phase 7B */}
          <Route path="/reporting"   element={<PrivateRoute><Reporting /></PrivateRoute>} />
          <Route path="/billing"     element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/compliance"  element={<PrivateRoute><Compliance /></PrivateRoute>} />
          <Route path="/devtools"    element={<PrivateRoute><DevTools /></PrivateRoute>} />

          {/* Phase 8A */}
          <Route path="/ai"          element={<PrivateRoute><AI /></PrivateRoute>} />

          {/* Phase 8B */}
          <Route path="/activity"    element={<PrivateRoute><ActivityFeed /></PrivateRoute>} />

          {/* Phase 8C */}
          <Route path="/cicd/settings" element={<PrivateRoute><CICDSettings /></PrivateRoute>} />
          <Route path="/cicd/triggers" element={<PrivateRoute><CICDTriggers /></PrivateRoute>} />

          {/* Phase 8E */}
          <Route path="/openapi-import" element={<PrivateRoute><OpenAPIImport /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}