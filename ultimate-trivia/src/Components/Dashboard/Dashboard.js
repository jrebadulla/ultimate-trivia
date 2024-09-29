import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Logo from "../Image/trivia-logo.png";
import Tutorials from "../Tutotial/Tutorial";
import QuizDashboard from "../QuizGames/QuizDashboard/QuizDashboard";

const DashboardLayout = () => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [activeComponent, setActiveComponent] = useState("trivia");

  useEffect(() => {
    setFirstname(localStorage.getItem("firstname") || "Firstname");
    setLastname(localStorage.getItem("lastname") || "Lastname");
    setProfilePicture(
      localStorage.getItem("profile_picture") || "/path/to/default-image.jpg"
    );
  }, []);

  const handleTutorialClick = () => {
    setActiveComponent("tutorial");
  };

  const handleQuizClick = () => {
    setActiveComponent("quiz");
  };

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <img src={Logo} alt="Ultimate Trivia Logo" />
        <h3>Ultimate Trivia</h3>
        <div className="links">
          <a>Trivia</a>
          <a href="#!" onClick={handleTutorialClick}>Tutorials</a>
          <a href="#!" onClick={handleQuizClick}>Quiz Game</a>
          <a href="#!">Compiler</a>
          <a href="#!">Statistics</a>
        </div>
        <div className="profile-container">
          <p className="username">
            {firstname} {lastname}
          </p>
          <img
            src={profilePicture}
            alt={`${firstname} ${lastname}'s Profile Picture`}
            className="profile-image"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              marginRight: "10px",
            }}
            onError={(e) => {
              e.target.src = "/path/to/default-image.jpg";
            }}
          />
        </div>
      </div>
      <div className="content">
      {activeComponent === "tutorial" && <Tutorials />}
      {activeComponent === "quiz" && <QuizDashboard />}
      </div>
    </div>
  );
};

export default DashboardLayout;
