import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../../Connection/firebaseConfig";
import "./TypingGame.css";

const TypingGame = () => {
  const [snippet, setSnippet] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const userId = localStorage.getItem("user_id");
  const gameId = 4;

  useEffect(() => {
    const fetchQuestions = async () => {
      const q = query(
        collection(db, "questions"),
        where("game_id", "==", gameId)
      );
      const questionsSnapshot = await getDocs(q);
      const questionsList = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setQuestions(questionsList);
      if (questionsList.length > 0) {
        const randomQuestion =
          questionsList[Math.floor(Math.random() * questionsList.length)];
        setSnippet(randomQuestion.question_text);
        setCurrentQuestion(randomQuestion);
      }
    };

    fetchQuestions();
  }, [gameId]);

  useEffect(() => {
    let interval = null;
    if (timer > 0 && !gameFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setGameFinished(true);
      setUserInput(snippet);
      setTimeTaken(60);
      saveUserScore(calculateScore());
    }

    return () => clearInterval(interval);
  }, [timer, gameFinished, snippet]);

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }

    const matchingChars = value
      .split("")
      .filter((char, i) => char === snippet[i]).length;
    const calculatedAccuracy = (matchingChars / snippet.length) * 100;
    setAccuracy(calculatedAccuracy);
    setUserInput(value);

    if (value === snippet && !gameFinished) {
      const endTimeValue = Date.now();
      const timeSpent = (endTimeValue - startTime) / 1000;

      setEndTime(endTimeValue);
      setTimeTaken(timeSpent);

      const calculatedScore = Math.round(calculatedAccuracy); 
      setUserScore(calculatedScore);

      setGameFinished(true);
      saveUserScore(calculatedScore, timeSpent); 
      clearInterval();
    }
  };

  const resetGame = () => {
    setUserInput("");
    setTimeTaken(null);
    setAccuracy(null);
    setStartTime(null);
    setEndTime(null);
    setTimer(60);
    setGameFinished(false);
    if (questions.length > 0) {
      const randomQuestion =
        questions[Math.floor(Math.random() * questions.length)];
      setSnippet(randomQuestion.question_text);
      setCurrentQuestion(randomQuestion);
    }
  };

  const calculateScore = () => {
    return accuracy ? Math.round(accuracy) : 0;
  };

  const saveUserScore = async (calculatedScore, finalTimeTaken) => {
    const userId = localStorage.getItem("user_id");
    const quizId = gameId;
    const totalQuestions = questions.length;
    const correctAnswers = calculatedScore;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const difficultyLevel = "medium";
    const dateTime = new Date();

    console.log("Saving score with details:", {
      userId,
      quizId,
      score: correctAnswers,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      dateTime,
      timeTaken: finalTimeTaken,
      difficultyLevel,
    });

    try {
      await addDoc(collection(db, "userScores"), {
        userId,
        quizId,
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        dateTime,
        timeTaken: finalTimeTaken,
        difficultyLevel,
      });
      console.log("Score saved successfully");
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="typing-game">
        {!gameFinished ? (
          <>
            <h2>Type the Code Snippet Below</h2>
            <pre>{snippet}</pre>

            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Start typing..."
              className="input-field"
            />
            <div className="timer">Time Left: {timer} seconds</div>
          </>
        ) : (
          <div className="game-over-container">
            <div className="game-over-header">Game Over!</div>
            <div className="game-over-score">Your Score: {userScore}</div>
            <div className="game-over-buttons">
              <button onClick={resetGame}>Play Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingGame;
