import React, { useEffect, useState } from "react";
import { Radar, Line } from "react-chartjs-2";
import "./Statistics.css";
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
  const [chartData, setChartData] = useState({});
  const [timeData, setTimeData] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [noData, setNoData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserScores = async () => {
      setIsLoading(true);
      const userId = localStorage.getItem("user_id");

      if (!userId) {
        console.error("User ID not found in localStorage");
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
        processChartData(data);
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

    const labels = data.map((item) => `Game ${item.game_id}`);
    const correctAnswers = data.map((item) => item.correctAnswers);
    const incorrectAnswers = data.map((item) => item.incorrectAnswers);
    const times = data.map((item) => (item.timeTaken / 60).toFixed(2));

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

    setTimeData({
      labels,
      datasets: [
        {
          label: "Time Taken (minutes)",
          data: times,
          borderColor: "#4BC0C0",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    });

    setSuggestions(
      data.map((item) => {
        const correctRate = (item.correctAnswers / item.totalQuestions) * 100;
        return correctRate >= 80
          ? `Great job in Game ${item.game_id}, keep it up!`
          : correctRate >= 50
          ? `You're doing well in Game ${item.game_id}, but there's room for improvement.`
          : `Keep practicing in Game ${item.game_id}, you'll improve!`;
      })
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (noData)
    return (
      <div>No data available. Please play a quiz to see your statistics.</div>
    );

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
            <Radar
              data={chartData}
              options={{
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
                },
              }}
            />
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
          {timeData && timeData.datasets && (
            <Line
              data={timeData}
              options={{
                responsive: true,
                scales: {
                  y: { beginAtZero: true, ticks: { color: "#ffffff" } },
                  x: { ticks: { color: "#ffffff" } },
                },
                plugins: {
                  legend: { labels: { color: "#ffffff" } },
                },
              }}
            />
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
        <ul style={{ listStyle: "none", padding: 0, textAlign: "center" }}>
          {suggestions.map((suggestion, index) => (
            <li key={index} style={{ color: "white", marginBottom: "10px" }}>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserStatistics;
