import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../Connection/firebaseConfig";
import "./MultipleChoice.css";

const MultipleChoice = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);
  const gameId = 2;
  const gameName = "Multiple Choice";

  const correctSound = new Audio('/sounds/correct.mp3');
  const incorrectSound = new Audio('/sounds/wrong.mp3');
  const gameOverSound = new Audio('/sounds/game-over.mp3');

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const levelId = localStorage.getItem("level_id");

        if (!levelId) {
          console.log("Level not found.");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "questions"),
          where("game_id", "==", gameId),
          where("level_id", "==", parseInt(levelId))
        );
        const querySnapshot = await getDocs(q);
        const loadedQuestions = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            options: [
              data.option_a,
              data.option_b,
              data.option_c,
              data.option_d,
            ],
          };
        });

        const shuffledQuestions = shuffleArray(loadedQuestions);
        setQuestions(shuffledQuestions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions from Firebase:", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [gameId]);

  useEffect(() => {
    let interval;
    if (!quizFinished) {
      interval = setInterval(() => {
        setTimer((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizFinished]);

  const handleAnswer = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      correctSound.play();
      setTotalCorrectAnswers((prev) => prev + 1);
    } else {
      incorrectSound.play();
    }

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);
      saveScore(totalCorrectAnswers + (isCorrect ? 1 : 0));
      gameOverSound.play();
    }
  };

  const saveScore = async (score) => {
    const userId = localStorage.getItem("user_id");
    const level_id = localStorage.getItem("level_id");
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const timeTaken = timer;
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
          game_name: gameName,
          game_id: gameId,
          score: correctAnswers,
          totalQuestions,
          correctAnswers,
          incorrectAnswers,
          dateTime,
          timeTaken,
          difficultyLevel,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            totalQuestions,
            score: correctAnswers,
            correctAnswers,
            incorrectAnswers,
            dateTime,
            timeTaken,
            difficultyLevel,
          });
          console.log("Score updated successfully");
        });
      }
    } catch (error) {
      console.error("Error saving/updating score:", error);
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setTotalCorrectAnswers(0);
    setQuizFinished(false);
    setTimer(0);
    setQuestions((prevQuestions) => shuffleArray([...prevQuestions]));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (questions.length === 0) {
    return <div>No questions available For Your Level.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div>
      {quizFinished ? (
        <div className="FourPic-game-over">
          <h2>Game Over!</h2>
          <p>
            Your final score is:{" "}
            <span className="FourPic-score">
              {totalCorrectAnswers} / {questions.length}
            </span>
          </p>
          <button
            onClick={handlePlayAgain}
            className="FourPic-play-again-button"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="question-container">
          <div>
            <p className="level">Level {currentQuestionIndex + 1}</p>
            <p className="current-question">{currentQuestion.question_text}</p>
            <div className="options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="option-button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleChoice;
