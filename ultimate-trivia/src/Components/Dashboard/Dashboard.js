import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";
import Logo from "../Image/trivia-logo.png";
import Tutorials from "../Tutotial/Tutorial";
import QuizDashboard from "../QuizGames/QuizDashboard/QuizDashboard";
import { useNavigate } from "react-router-dom";
import Compiler from "../Compiler/Compiler";
import Trivia from "../Trivia/Trivia";
import Manage from "../AdminManagement/AdminManagement";
import UserStatistics from "../Statistics/Statistics";

const DashboardLayout = () => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [activeComponent, setActiveComponent] = useState("trivia");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isLevelDropdownVisible, setLevelDropdownVisible] = useState(false);
  const [userRole, setUserRole] = useState("");
  const dropdownRef = useRef(null);
  const [selectedYear, setSelectedYear] = useState(localStorage.getItem('selectedYear') || 'Year Level');
  const navigate = useNavigate();

  useEffect(() => {
    setFirstname(localStorage.getItem("firstname") || "Firstname");
    setLastname(localStorage.getItem("lastname") || "Lastname");
    setProfilePicture(
      localStorage.getItem("profile_picture") || "/path/to/default-image.jpg"
    );
    setUserRole(localStorage.getItem("role") || "user");

    const storedActiveComponent = localStorage.getItem("activeComponent");
    if (storedActiveComponent) {
        setActiveComponent(storedActiveComponent);
    }

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

  const handleStatisticsClick = () => {
    setActiveComponent("statistics");
  };

  const handleSignInOut = () => {
    localStorage.clear();
    navigate("/signOut");
    setIsDropdownVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false); 
        setLevelDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownVisible((prev) => !prev); 
  };

  const handleYearLevelClick = (event) => {
    event.preventDefault();
    setLevelDropdownVisible(!isLevelDropdownVisible);
  };

  const handleYearClick = (yearLevel) => {
    let yearLabel = '';
    switch (yearLevel) {
      case 1:
        yearLabel = 'First Year';
        break;
      case 2:
        yearLabel = 'Second Year';
        break;
      case 3:
        yearLabel = 'Third Year';
        break;
      case 4:
        yearLabel = 'Fourth Year';
        break;
      default:
        yearLabel = 'Year Level';
        localStorage.setItem('selectedYear', yearLabel);
    }
    setSelectedYear(yearLabel);
    localStorage.setItem('selectedYear', yearLabel); 
    localStorage.setItem("level_id", yearLevel);
    localStorage.setItem("activeComponent", activeComponent);
    setLevelDropdownVisible(false);
    window.location.reload();
  };

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <img src={Logo} alt="Ultimate Trivia Logo" />
        <h3>Ultimate Trivia</h3>
        <div className="links">
          {userRole === "admin" && (
            <a href="#!" onClick={handleManageClick}>
              Admin
            </a>
          )}
          <a onClick={handleTriviaClick}>Trivia</a>
          <a href="#!" onClick={handleTutorialClick}>
            Tutorials
          </a>
          <a href="#!" onClick={handleQuizClick}>
            Quiz Games
          </a>
          <a href="#!" onClick={handleCompilerClick}>
            Online Compiler
          </a>
          <a href="#!" onClick={handleStatisticsClick}>
            Statistics
          </a>
          <div>
          <a href="#!" onClick={handleYearLevelClick}>
        {selectedYear}
      </a>
            {isLevelDropdownVisible && (
              <div  ref={dropdownRef} className="dropdown">
                <ul>
                  <li>
                    <a href="#!" onClick={() => handleYearClick(1)}>
                      First Year
                    </a>
                  </li>
                  <li>
                    <a href="#!" onClick={() => handleYearClick(2)}>
                      Second Year
                    </a>
                  </li>
                  <li>
                    <a href="#!" onClick={() => handleYearClick(3)}>
                      Third Year
                    </a>
                  </li>
                  <li>
                    <a href="#!" onClick={() => handleYearClick(4)}>
                      Fourth Year
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div
          className="profile-container"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <p
            className="username"
            style={{
              display: "inline-block",
              margin: "0 10px",
              cursor: "pointer",
            }}
          >
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
              cursor: "pointer",
            }}
            onClick={handleDropdownToggle}
            onError={(e) => {
              e.target.src = "/path/to/default-image.jpg";
            }}
          />
          {isDropdownVisible && (
            <div
              ref={dropdownRef}
              className="sign-in-out"
              style={{
                position: "absolute",
                top: "47px",
                right: "-3px",
                backgroundColor: "#fff",
                padding: "2px 10px",
                borderRadius: "5px",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
                cursor: "pointer",
                zIndex: 1,
                width: "80px",
                fontSize: "12px"
              }}
            >
              <div onClick={handleSignInOut}>Sign Out</div>
            </div>
          )}
        </div>
      </div>
      <div className="content">
        {activeComponent === "tutorial" && <Tutorials />}
        {activeComponent === "quiz" && <QuizDashboard />}
        {activeComponent === "compiler" && <Compiler />}
        {activeComponent === "trivia" && <Trivia />}
        {activeComponent === "statistics" && <UserStatistics />}
        {activeComponent === "manage" && <Manage userRole={userRole} />}
      </div>
    </div>
  );
};

export default DashboardLayout;
