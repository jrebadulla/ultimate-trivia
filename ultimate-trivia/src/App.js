import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./Components/LoginPage/LoginPage";
import DashboardLayout from "./Components/Dashboard/Dashboard";
import UserStatistics from "./Components/Statistics/Statistics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />}></Route>
        <Route path="/dashboard" element={<DashboardLayout />}></Route>
        <Route path="/signOut" element={<LoginPage />}></Route>
        <Route path="/statistics" element={<UserStatistics />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
