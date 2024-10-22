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
  const [loading, setLoading] = useState(true);
  const [pasteAttempted, setPasteAttempted] = useState(false);
  const [errorIndices, setErrorIndices] = useState([]);
  const gameId = 4;
  const gameName = "Typing";

  const errorSound = new Audio("/sounds/wrong.mp3");

  useEffect(() => {
    const fetchQuestions = async () => {
      const levelId = localStorage.getItem("level_id");

      if (!levelId) {
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
      const totalTimeSpent = 60;
      setTimeTaken(totalTimeSpent);
      const finalScore = calculateScore();
      setUserScore(finalScore);
      saveUserScore(finalScore, totalTimeSpent);
    }

    return () => clearInterval(interval);
  }, [timer, gameFinished]);

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }

    const lastCharIndex = value.length - 1;

    // Check if the last character is correct
    const isCorrect = value[lastCharIndex] === snippet[lastCharIndex];

    // If the character is incorrect, play the error sound and do not update userInput
    if (!isCorrect) {
      errorSound.play(); // Play sound on wrong input
      setErrorIndices((prev) => [...prev, lastCharIndex]); // Store index of wrong input
      return; // Prevent further processing
    } else {
      setErrorIndices((prev) =>
        prev.filter((index) => index !== lastCharIndex)
      ); // Remove index if corrected
    }

    // Update userInput only if the last character is correct
    setUserInput(value);

    const matchingChars = value
      .split("")
      .filter((char, i) => char === snippet[i]).length;
    const calculatedAccuracy = (matchingChars / snippet.length) * 100;
    setAccuracy(calculatedAccuracy);

    // Prevent proceeding if the letter is incorrect
    if (value === snippet && !gameFinished) {
      const endTimeValue = Date.now();
      const timeSpent = (endTimeValue - startTime) / 1000;

      setEndTime(endTimeValue);
      setTimeTaken(timeSpent);
      const calculatedScore = Math.round(calculatedAccuracy);
      setUserScore(calculatedScore);

      saveUserScore(calculatedScore, timeSpent);
      setGameFinished(true);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setPasteAttempted(true);
    setTimeout(() => {
      setPasteAttempted(false);
    }, 2000);
  };

  const goToNextLevel = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSnippet(questions[currentQuestionIndex + 1].question_text);
      setUserInput("");
      setErrorIndices([]);
      setGameFinished(false);
      setAccuracy(null);
      setTimeTaken(null);
      setStartTime(null);
      setTimer(60);
    } else {
      alert("You've completed all levels!");
      resetGame();
    }
  };

  const resetGame = () => {
    setUserInput("");
    setErrorIndices([]);
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
            <pre>
              {snippet.split("").map((char, index) => (
                <span
                  key={index}
                  className={errorIndices.includes(index) ? "error" : ""}
                >
                  {char}
                </span>
              ))}
            </pre>
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder="Start typing..."
              className="input-field"
            />
            {pasteAttempted && (
              <div className="paste-message">Copy-pasting is not allowed!</div>
            )}
            <div className="timer-typing">Time Left: {timer} seconds</div>
          </>
        ) : (
          <div className="FourPic-game-over">
            <h2>Great Job!</h2>
            <p>
              <strong>You earned</strong> {accuracy ? accuracy.toFixed(2) : 0}%
              for accuracy!
              <br />
              <strong>Time Taken:</strong>{" "}
              {timeTaken ? timeTaken.toFixed(2) : 0} seconds
              <br />
              <strong>Your Score:</strong> {userScore}
            </p>
            <button onClick={resetGame} className="FourPic-play-again-button">
              Restart
            </button>
            <button
              onClick={goToNextLevel}
              className="FourPic-play-again-button reset"
            >
              Next Level
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingGame;
