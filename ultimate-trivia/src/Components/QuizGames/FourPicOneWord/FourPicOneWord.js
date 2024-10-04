import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../../Connection/firebaseConfig";
import "./FourPicOneWord.css";

const FourPicsOneWord = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [gameStatus, setGameStatus] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [inputClass, setInputClass] = useState("");
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true); 

  const userId = localStorage.getItem("user_id");
  const gameId = 5;

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
      if (questionsList.length > 0) {
        setCorrectAnswer(questionsList[0].correct_answer);
      }
      setLoading(false); 
    };

    fetchQuestions();
    startGame();
  }, [gameId]);

  const startGame = () => {
    setStartTime(Date.now());
  };

  const handleLetterChange = (index, value) => {
    const newAnswer = userAnswer.split("");
    newAnswer[index] = value.slice(-1); 
    setUserAnswer(newAnswer.join(""));
  };

  const handleSubmitAnswer = async () => {
    if (gameFinished) return;

    if (
      correctAnswer &&
      userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    ) {
      setGameStatus("Correct!");
      setInputClass("correct");
      const newScore = score + 1;
      setScore(newScore);
      setShowScore(true);

      setTimeout(async () => {
        if (currentQuestionIndex + 1 < questions.length) {
          const nextQuestion = questions[currentQuestionIndex + 1];
          setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
          setCorrectAnswer(nextQuestion?.correct_answer || "");
          setUserAnswer("");
          setShowScore(false);
        } else {
          setGameStatus("Game Over!");
          setInputClass("");
          setGameFinished(true);
          await finishGame(newScore);
        }
      }, 1000);
    } else {
      setGameStatus("Wrong! Try Again.");
      setInputClass("incorrect");
      setShowScore(true);
    }
  };

  const finishGame = async (finalScore) => {
    const endTime = Date.now();
    const finalTimeTaken = (endTime - startTime) / 1000; 
    await saveUserScore(finalScore, finalTimeTaken);
  };

  const saveUserScore = async (calculatedScore, finalTimeTaken) => {
    const game_id = gameId;
    const totalQuestions = questions.length;
    const correctAnswers = calculatedScore;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const difficultyLevel = "medium";
    const dateTime = new Date();

    try {
      await addDoc(collection(db, "userScores"), {
        userId,
        game_id,
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

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setScore(0);
    setGameFinished(false);
    setGameStatus("");
    setStartTime(Date.now()); 
  };

  if (loading) {
    return <div className="FourPic-question-container">Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div className="FourPic-question-container">No questions available For Your Level.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="FourPic-game-container">
      <div>
        <p className="level">Level {currentQuestionIndex + 1}</p>
      </div>
      <p className="fourPic-score">Score: {score}</p>
      <h2 className="FourPic-question-text">{currentQuestion.question_text}</h2>
      <div className="FourPic-images">
        {currentQuestion.image1 && (
          <img
            src={currentQuestion.image1}
            alt="Image 1"
            className="FourPic-image"
          />
        )}
        {currentQuestion.image2 && (
          <img
            src={currentQuestion.image2}
            alt="Image 2"
            className="FourPic-image"
          />
        )}
        {currentQuestion.image3 && (
          <img
            src={currentQuestion.image3}
            alt="Image 3"
            className="FourPic-image"
          />
        )}
        {currentQuestion.image4 && (
          <img
            src={currentQuestion.image4}
            alt="Image 4"
            className="FourPic-image"
          />
        )}
      </div>
      <div className="FourPic-answer-boxes">
        {Array.from({ length: correctAnswer.length }).map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength="1"
            value={userAnswer[index] || ""}
            onChange={(e) => handleLetterChange(index, e.target.value)}
            className={`FourPic-answer-box ${inputClass}`}
          />
        ))}
      </div>
      <button
        className="FourPic-submit-button"
        onClick={handleSubmitAnswer}
        disabled={userAnswer.length < correctAnswer.length}
      >
        Submit
      </button>
      {showScore && <div className="FourPic-status-message">{gameStatus}</div>}
      {gameFinished && (
        <div className="FourPic-game-over">
          <p>Game Over! Your score: {score}</p>
          <button onClick={handlePlayAgain} className="FourPic-play-again-button">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FourPicsOneWord;
