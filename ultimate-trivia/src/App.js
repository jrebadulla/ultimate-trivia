import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./Components/LoginPage/LoginPage";
import DashboardLayout from "./Components/Dashboard/Dashboard";
import UserStatistics from "./Components/Statistics/Statistics";
import { AuthProvider } from "./Connection/AuthContext";
import ProtectedRoute from "./Connection/ProtectedRoute";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />}></Route>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          ></Route>
          <Route path="/signOut" element={<LoginPage />}></Route>
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <UserStatistics />
              </ProtectedRoute>
            }
          ></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
