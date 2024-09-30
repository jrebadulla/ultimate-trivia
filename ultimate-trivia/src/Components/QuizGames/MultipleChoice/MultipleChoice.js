import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../../Connection/firebaseConfig";
import "./MultipleChoice.css";

const MultipleChoice = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100); 
  const [timer, setTimer] = useState(0); 
  const gameId = 2;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(
          collection(db, "questions"),
          where("game_id", "==", gameId)
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
        setQuestions(loadedQuestions);
      } catch (error) {
        console.error("Error fetching questions from Firebase:", error);
      }
    };

    fetchQuestions();
  }, []);

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
      setTotalCorrectAnswers((prev) => prev + 1);
    }

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);
      saveScore(totalCorrectAnswers + (isCorrect ? 1 : 0));
    }
  };

  const saveScore = async (score) => {
    const userId = localStorage.getItem("user_id");
    const quizId = questions[currentQuestionIndex]?.game_id;
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const timeTaken = timer; 
    const difficultyLevel = "medium";
    const dateTime = new Date();

    try {
      await addDoc(collection(db, "userScores"), {
        userId,
        quizId,
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        dateTime,
        timeTaken,
        difficultyLevel,
      });
      console.log("Score saved successfully");
      console.log(score);
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setTotalCorrectAnswers(0);
    setQuizFinished(false);
    setTimeLeft(100);
    setTimer(0); 
  };

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="modal-content">
      {quizFinished ? (
        <div className="results">
          <h2 className="modal-header">Game Over!</h2>
          <div className="score-summary">
            <h3>
              Total Score: {totalCorrectAnswers} / {questions.length}
            </h3>
            <h3>Time Taken: {timer} seconds</h3> 
          </div>
          <button className="play-again-button" onClick={handlePlayAgain}>
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
