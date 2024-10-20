import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const gameId = 4;
  const gameName = "Typing";

  useEffect(() => {
    const fetchQuestions = async () => {
      const levelId = localStorage.getItem("level_id");

      if (!levelId) {
        setGameStatus("Level not found.");
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "questions"),
        where("game_id", "==", gameId),
        where("level_id", "==", parseInt(levelId))
      );
      const questionsSnapshot = await getDocs(q);
      const questionsList = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setQuestions(questionsList);
      setLoading(false);
      if (questionsList.length > 0) {
        setSnippet(questionsList[0].question_text);
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
      const finalScore = calculateScore();
      setUserScore(finalScore);
      saveUserScore(finalScore, 60 - timer);
    }

    return () => clearInterval(interval);
  }, [timer, gameFinished]);

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }

    // Calculate accuracy based on correct characters typed
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

      // Set score based on calculated accuracy
      const calculatedScore = Math.round(calculatedAccuracy);
      setUserScore(calculatedScore);

      // Save the score and time taken
      saveUserScore(calculatedScore, timeSpent);

      // Proceed to the next question or finish the game
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        setSnippet(questions[currentQuestionIndex + 1].question_text);
        setUserInput("");
      } else {
        setGameFinished(true);
      }
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
    setCurrentQuestionIndex(0);

    if (questions.length > 0) {
      setSnippet(questions[0].question_text);
    }
  };

  const calculateScore = () => {
    const matchingChars = userInput
      .split("")
      .filter((char, i) => char === snippet[i]).length;
    const calculatedAccuracy = (matchingChars / snippet.length) * 100;
    return Math.round(calculatedAccuracy);
  };

  const saveUserScore = async (calculatedScore, finalTimeTaken) => {
    const userId = localStorage.getItem("user_id");
    const level_id = localStorage.getItem("level_id");
    const game_id = gameId;
    const totalQuestions = questions.length;
    const correctAnswers = Math.round(calculatedScore);
    const incorrectAnswers = totalQuestions - correctAnswers;
    const difficultyLevel = "medium";
    const dateTime = new Date();

    const scoresRef = collection(db, "userScores");
    const q = query(
      scoresRef,
      where("userId", "==", userId),
      where("game_id", "==", gameId),
      where("level_id", "==", level_id)
    );

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(scoresRef, {
          userId,
          level_id,
          game_id,
          score: correctAnswers,
          game_name: gameName,
          totalQuestions,
          correctAnswers,
          incorrectAnswers,
          dateTime,
          timeTaken: finalTimeTaken,
          difficultyLevel,
        });
        console.log("Score saved successfully");
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            totalQuestions,
            score: correctAnswers,
            correctAnswers,
            incorrectAnswers,
            dateTime,
            timeTaken: finalTimeTaken,
            difficultyLevel,
          });
          console.log("Score updated successfully");
        });
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (questions.length === 0) {
    return <div>No questions available For Your Level.</div>;
  }

  return (
    <div>
      <div>
        <p className="level">Level {currentQuestionIndex + 1}</p>
      </div>
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
            <div className="timer-typing">Time Left: {timer} seconds</div>
          </>
        ) : (
          <div className="FourPic-game-over">
            <h2>Game Over!</h2>
            <p>
              Your final score is:{" "}
              <span className="FourPic-score">
                {userScore}
              </span>
            </p>
            <button onClick={resetGame} className="FourPic-play-again-button">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingGame;
