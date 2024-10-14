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

  const userId = localStorage.getItem("user_id");
  const gameId = 5;
  const gameName = "Pic Code Challenge"

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
          setInputClass("");
          setGameFinished(true);
          await finishGame(newScore);
        }
      }, 1000);
    } else {
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

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setScore(0);
    setGameFinished(false);
    setStartTime(Date.now());
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
          <h2>Game Over!</h2>
          <p>
            Your final score is: <span className="FourPic-score">{score}</span>
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
          <div>
            <p className="level">Level {currentQuestionIndex + 1}</p>
          </div>
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
        </>
      )}
    </div>
  );
};

export default FourPicsOneWord;
