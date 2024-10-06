import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Logo from "../Image/trivia-logo.png";
import Tutorials from "../Tutotial/Tutorial";
import QuizDashboard from "../QuizGames/QuizDashboard/QuizDashboard";
import { useNavigate } from "react-router-dom";
import Compiler from "../Compiler/Compiler";
import Trivia from "../Trivia/Trivia";
import Manage from "../AdminManagement/AdminManagement";

const DashboardLayout = () => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [activeComponent, setActiveComponent] = useState("trivia");
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate(); 

  useEffect(() => {
    setFirstname(localStorage.getItem("firstname") || "Firstname");
    setLastname(localStorage.getItem("lastname") || "Lastname");
    setProfilePicture(
      localStorage.getItem("profile_picture") || "/path/to/default-image.jpg"
    );
    setUserRole(localStorage.getItem("role") || "user"); 
    console.log(userRole);
  }, []);

  const handleTutorialClick = () => {
    setActiveComponent("tutorial");
  };

  const handleQuizClick = () => {
    setActiveComponent("quiz");
  };

  const handleCompilerClick = () => {
    setActiveComponent("compiler");
  };

  const handleTriviaClick = () => {
    setActiveComponent("trivia");
  };

  const handleManageClick = () => {
    setActiveComponent("manage");
  };

  const handleSignInOut = () => {
    navigate("/signOut");
  };

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <img src={Logo} alt="Ultimate Trivia Logo" />
        <h3>Ultimate Trivia</h3>
        <div className="links">
          {userRole === "admin" && ( 
            <a href="#!" onClick={handleManageClick}>Admin</a>
          )}
          <a onClick={handleTriviaClick}>Trivia</a>
          <a href="#!" onClick={handleTutorialClick}>Tutorials</a>
          <a href="#!" onClick={handleQuizClick}>Quiz Games</a>
          <a href="#!" onClick={handleCompilerClick}>Online Compiler</a>
          <a href="#!">Statistics</a>
        </div>
        <div 
          className="profile-container" 
          style={{ position: "relative" }}
          onMouseEnter={() => {
            setIsHovered(true);
            setIsDropdownVisible(true);
          }}
          onMouseLeave={() => {
            if (!isDropdownVisible) {
              setIsHovered(false);
            }
          }}
        >
          <p className="username" style={{ display: "inline-block", margin: "0 10px", cursor: "pointer" }}>
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
              marginLeft: "10px",
            }}
            onError={(e) => {
              e.target.src = "/path/to/default-image.jpg";
            }}
          />
          {isHovered && (
            <div
              className="sign-in-out"
              onClick={handleSignInOut}
              onMouseEnter={() => setIsDropdownVisible(true)} 
              onMouseLeave={() => {
                setIsDropdownVisible(false); 
                setIsHovered(false);
              }}
              style={{
                position: "absolute",
                top: "35px",
                right: "99px",
                backgroundColor: "#fff",
                borderRadius: "5px",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
                cursor: "pointer",
                zIndex: 1,
              }}
            >
              Sign Out
            </div>
          )}
        </div>
      </div>
      <div className="content">
        {activeComponent === "tutorial" && <Tutorials />}
        {activeComponent === "quiz" && <QuizDashboard />}
        {activeComponent === "compiler" && <Compiler />}
        {activeComponent === "trivia" && <Trivia />}
        {activeComponent === "manage" && <Manage userRole={userRole} />}
      </div>
    </div>
  );
};

export default DashboardLayout;
