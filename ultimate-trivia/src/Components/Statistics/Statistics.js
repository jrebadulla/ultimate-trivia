import React, { useEffect, useState, useContext } from "react";
import { Radar, Line } from "react-chartjs-2";
import "./Statistics.css";
import noFound from "./no_data_icon.png";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../Connection/firebaseConfig";
import ActiveComponentContext from "../Dashboard/ActiveComponentContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

const UserStatistics = () => {
  const { setActiveComponent } = useContext(ActiveComponentContext);
  const [chartData, setChartData] = useState({});
  const [timeData, setTimeData] = useState({});
  const [timeTakenData, setTimeTakenData] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [noData, setNoData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserScores = async () => {
      setIsLoading(true);
      const userId = localStorage.getItem("user_id");
      const levelId = localStorage.getItem("level_id");

      if (!userId || !levelId) {
        console.error("User ID or Level ID not found in localStorage");
        setNoData(true);
        setIsLoading(false);
        return;
      }

      try {
        const scoresRef = collection(db, "userScores");
        const q = query(scoresRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No data found for this user");
          setNoData(true);
          setIsLoading(false);
          return;
        }

        const data = querySnapshot.docs.map((doc) => doc.data());
        console.log("Data ready for processing:", data);

        const filteredData = data.filter((item) => item.level_id === levelId);

        processChartData(filteredData);
      } catch (error) {
        console.error("Error fetching user scores:", error);
        setNoData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserScores();
  }, []);

  const processChartData = (data) => {
    console.log("Data received for processing:", data);
    if (!data.length) {
      console.log("No data to process");
      setNoData(true);
      return;
    }

    // Filter out the "Typing" game data
    const filteredData = data.filter((item) => item.game_name !== "Typing");

    // Map through the filtered data for labels and datasets
    const labels = filteredData.map((item) => `${item.game_name}`);
    const correctAnswers = filteredData.map((item) => item.correctAnswers);
    const incorrectAnswers = filteredData.map((item) => item.incorrectAnswers);
    const times = filteredData.map((item) => (item.timeTaken / 60).toFixed(2));

    setChartData({
      labels,
      datasets: [
        {
          label: "Correct Answers",
          data: correctAnswers,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "#36A2EB",
          borderWidth: 2,
        },
        {
          label: "Incorrect Answers",
          data: incorrectAnswers,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "#FF6384",
          borderWidth: 2,
        },
      ],
    });

    setTimeTakenData({
      labels,
      datasets: [
        {
          label: "Time Taken (minutes)",
          data: times,
          borderColor: "#4BC0C0",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "white",
        },
      ],
    });

    setSuggestions(
      filteredData.map((item) => {
        const correctRate = (item.correctAnswers / item.totalQuestions) * 100;
        return correctRate >= 80
          ? {
              text: `Great job in Game ${item.game_name}, keep it up!`,
              icon: "success",
            }
          : correctRate >= 50
          ? {
              text: `You're doing well in Game ${item.game_name}, but there's room for improvement.`,
              icon: "warning",
            }
          : {
              text: `Keep practicing in Game ${item.game_name}, you'll improve!`,
              icon: "improve",
            };
      })
    );
  };

  const radarOptions = {
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.5)" },
        grid: { color: "rgba(255, 255, 255, 0.2)" },
        ticks: { display: false },
        pointLabels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: { size: 14 },
        },
      },
    },
    plugins: {
      legend: { labels: { color: "white" } },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (tooltipItems) {
            return `${tooltipItems.dataset.label}: ${tooltipItems.raw}`;
          },
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true, ticks: { color: "#ffffff" } },
      x: { ticks: { color: "#ffffff" } },
    },
    plugins: {
      legend: { labels: { color: "#ffffff" } },
    },
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#282c34",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  if (noData) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#282c34",
          color: "white",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <img
          src={noFound}
          alt="No Data"
          style={{ width: "100px", marginBottom: "20px" }}
        />
        <h2>No Data Available</h2>
        <p>Please play a quiz to see your statistics, or check back later.</p>
        <button
          onClick={() => setActiveComponent("quiz")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            color: "#282c34",
            backgroundColor: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Take a Quiz Now
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
        backgroundColor: "#282c34",
        padding: "20px",
      }}
    >
      <div
        style={{ flex: 1, display: "flex", justifyContent: "space-between" }}
      >
        <div
          style={{
            width: "60%",
            padding: "20px",
            backgroundColor: "#1e1e2e",
            borderRadius: "8px",
          }}
        >
          {chartData && chartData.datasets && (
            <Radar data={chartData} options={radarOptions} />
          )}
        </div>
        <div
          style={{
            width: "38%",
            padding: "20px",
            backgroundColor: "#1e1e2e",
            borderRadius: "8px",
          }}
        >
          {timeTakenData && timeTakenData.datasets && (
            <Line data={timeTakenData} options={lineOptions} />
          )}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          padding: "20px",
          backgroundColor: "#1e1e2e",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <h2
          style={{ color: "white", textAlign: "center", marginBottom: "20px" }}
        >
          Performance Suggestions
        </h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              style={{
                marginBottom: "10px",
                backgroundColor: "#333",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              <span
                style={{
                  color:
                    suggestion.icon === "success"
                      ? "green"
                      : suggestion.icon === "warning"
                      ? "orange"
                      : "red",
                }}
              >
                {suggestion.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserStatistics;
