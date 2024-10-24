import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../Connection/firebaseConfig";
import "./FourPicOneWord.css";

const FourPicsOneWord = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [inputClass, setInputClass] = useState("");
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const [hintsLeft, setHintsLeft] = useState(3); // Hints

  const inputRefs = useRef([]);

  const userId = localStorage.getItem("user_id");
  const gameId = 5;
  const gameName = "Four Pics One Word";

  const correctSound = new Audio("/sounds/correct.mp3");
  const incorrectSound = new Audio("/sounds/wrong.mp3");
  const gameOverSound = new Audio("/sounds/game-over.mp3");

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

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
      let questionsList = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      questionsList = shuffle(questionsList);
      setQuestions(questionsList);
      if (questionsList.length > 0) {
        setCorrectAnswer(questionsList[0].correct_answer);
      }
      setLoading(false);
    };

    fetchQuestions();
    startGame();
  }, [gameId]);

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive]);

  const startGame = () => {
    setStartTime(Date.now());
    setTimeLeft(30); // Reset timer to 30 seconds when game starts
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    setInputClass("incorrect");
    incorrectSound.play();
    setShowScore(true);

    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        const nextQuestion = questions[currentQuestionIndex + 1];
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        setCorrectAnswer(nextQuestion?.correct_answer || "");
        setUserAnswer("");
        setTimeLeft(30); // Reset timer to 30 seconds for the next question
        setTimerActive(true);
        setShowScore(false);
      } else {
        setGameFinished(true);
        finishGame(score);
      }
    }, 1000);
  };

  const handleLetterChange = (index, value) => {
    const newAnswer = userAnswer.split("");
    newAnswer[index] = value.slice(-1);
    setUserAnswer(newAnswer.join(""));
    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleSubmitAnswer = async () => {
    if (gameFinished) return;

    if (
      correctAnswer &&
      userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    ) {
      setInputClass("correct");
      const newScore = score + 1;
      setScore(newScore);
      setShowScore(true);
      correctSound.play();

      setTimeout(async () => {
        if (currentQuestionIndex + 1 < questions.length) {
          const nextQuestion = questions[currentQuestionIndex + 1];
          setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
          setCorrectAnswer(nextQuestion?.correct_answer || "");
          setUserAnswer("");
          setShowScore(false);
          setTimeLeft(30); // Reset timer to 30 seconds for the next question
        } else {
          setInputClass("");
          setGameFinished(true);
          await finishGame(newScore);
        }
      }, 1000);
    } else {
      setInputClass("incorrect");
      setShowScore(true);
      incorrectSound.play();
    }
  };

  const finishGame = async (finalScore) => {
    const endTime = Date.now();
    const finalTimeTaken = (endTime - startTime) / 1000;
    await saveUserScore(finalScore, finalTimeTaken);
    gameOverSound.play();
  };

  const saveUserScore = async (calculatedScore, finalTimeTaken) => {
    const level_id = localStorage.getItem("level_id");
    const game_id = gameId;
    const totalQuestions = questions.length;
    const correctAnswers = calculatedScore;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const difficultyLevel = "medium";
    const dateTime = new Date();

    const scoresRef = collection(db, "userScores");
    const q = query(
      scoresRef,
      where("userId", "==", userId),
      where("game_id", "==", game_id),
      where("level_id", "==", level_id)
    );

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(scoresRef, {
          userId,
          level_id,
          game_name: gameName,
          game_id,
          score: correctAnswers,
          totalQuestions,
          correctAnswers,
          incorrectAnswers,
          dateTime,
          timeTaken: finalTimeTaken,
          difficultyLevel,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          if (doc.data().score < correctAnswers) {
            await updateDoc(doc.ref, {
              totalQuestions,
              score: correctAnswers,
              correctAnswers,
              incorrectAnswers,
              dateTime,
              timeTaken: finalTimeTaken,
              difficultyLevel,
            });
          }
        });
      }
      console.log("Score saved/updated successfully");
    } catch (error) {
      console.error("Error saving/updating score:", error);
    }
  };

  const useHint = () => {
    if (hintsLeft > 0 && correctAnswer.length > userAnswer.length) {
      const newAnswer = userAnswer.split("");
      for (let i = 0; i < correctAnswer.length; i++) {
        if (!newAnswer[i]) {
          newAnswer[i] = correctAnswer[i];
          break;
        }
      }
      setUserAnswer(newAnswer.join(""));
      setHintsLeft(hintsLeft - 1);
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setScore(0);
    setGameFinished(false);
    setStartTime(Date.now());
    setTimeLeft(30); // Reset timer to 30 seconds when the game restarts
  };

  if (loading) {
    return (
      <div className="FourPic-question-container">Loading questions...</div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="FourPic-question-container">
        No questions available For Your Level.
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div>
      {gameFinished ? (
        <div className="FourPic-game-over">
          <h2>Congratulations!</h2>
          <p>
            You've completed this chapter. Stay tuned for more challenges coming
            soon!
          </p>
          <button
            onClick={handlePlayAgain}
            className="FourPic-play-again-button"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="FourPic-scoreboard">
        
          </div>
          <div>
            <p className="level">Level {currentQuestionIndex + 1}</p>
          </div>
          <div className="FourPic-timer">Time left: {timeLeft}s</div>
          <h2 className="FourPic-question-text">
            {currentQuestion.question_text}
          </h2>
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
                ref={(el) => (inputRefs.current[index] = el)}
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
          <button
            className="FourPic-hint-button"
            onClick={useHint}
            disabled={hintsLeft === 0}
          >
            Use Hint ({hintsLeft} left)
          </button>
        </>
      )}
    </div>
  );
};

export default FourPicsOneWord;
