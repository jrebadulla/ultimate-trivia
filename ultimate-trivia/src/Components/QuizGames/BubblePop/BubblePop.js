import React, { useState, useEffect, useMemo, useRef } from "react";
import "./BubblePop.css";
import { v4 as uuidv4 } from "uuid";
import useSound from "use-sound";
import { db } from "../../../Connection/firebaseConfig";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const BubblePopQuiz = React.memo(() => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popBubbleId, setPopBubbleId] = useState(null);
  const gameId = 1;

  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex],
    [questions, currentQuestionIndex]
  );

  const [playPopSound] = useSound("/sounds/pop.mp3", { volume: 0.75 });
  const [playCorrectSound] = useSound("/sounds/correct.mp3", { volume: 0.75 });
  const [playWrongSound] = useSound("/sounds/wrong.mp3", { volume: 0.75 });
  const [playGameOverSound] = useSound("/sounds/game-over.mp3", {
    volume: 0.75,
  });

  const scoreSavedRef = useRef(false);
  const saveTimestampRef = useRef(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
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
            id: doc.id,
            incorrect_answers: [
              data.option_a,
              data.option_b,
              data.option_c,
              data.option_d,
            ].filter((option) => option !== data.correct_answer),
          };
        });
        setQuestions(loadedQuestions);
      } catch (error) {
        setError("Failed to fetch questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!gameOver && questions.length > 0) {
      createBubbles();
      const interval = setInterval(createBubbles, 5000);
      return () => clearInterval(interval);
    }
  }, [questions, gameOver, currentQuestionIndex]);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft <= 0) {
      if (!gameOver) {
        setGameOver(true);
        playGameOverSound();
      }
    }
  }, [timeLeft, gameOver, playGameOverSound, score]);

  const createBubbles = () => {
    if (currentQuestion) {
      const allAnswers = [
        currentQuestion.correct_answer,
        ...currentQuestion.incorrect_answers,
      ];
      const shuffledAnswers = allAnswers
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
      const newBubbles = shuffledAnswers.map((answer, index) => ({
        id: uuidv4(),
        answer,
        left: `${(index % 2) * (100 / 2)}%`,
        top: `${Math.floor(index / 2) * (100 / 2)}%`,
      }));
      setBubbles(newBubbles);
    }
  };

  const handleBubbleClick = (id, answer) => {
    if (gameOver) return;

    setPopBubbleId(id);
    playPopSound();

    setTimeout(() => {
      const isCorrect = answer === currentQuestion.correct_answer;

      if (isCorrect) {
        setScore((prevScore) => {
          const newScore = prevScore + 1;
          playCorrectSound();
          return newScore;
        });
      } else {
        playWrongSound();
      }

      setBubbles((prevBubbles) =>
        prevBubbles.filter((bubble) => bubble.id !== id)
      );

      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex >= questions.length) {
        setGameOver(true);
        playGameOverSound();
        saveScore(score + 1);
      } else {
        setCurrentQuestionIndex(nextQuestionIndex);
      }
    }, 500);
  };

  const saveScore = async (score) => {
    const userId = localStorage.getItem("user_id");
    const quizId = currentQuestion?.game_id;
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const timeTaken = 100 - timeLeft;
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
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const restartGame = () => {
    setBubbles([]);
    setScore(0);
    setTimeLeft(100);
    setCurrentQuestionIndex(0);
    setGameOver(false);
    scoreSavedRef.current = false;
    saveTimestampRef.current = null;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      {!gameOver ? (
        <div>
          <div>
            <p className="level">Level {currentQuestionIndex + 1}</p>
            <p className="timer">Time Left: {timeLeft}s</p>
            <p className="current-question">{currentQuestion?.question_text}</p>
          </div>
          <div className="bubble-quiz-area">
            {bubbles.map((bubble) => (
              <div
                key={bubble.id}
                className={`bubble ${popBubbleId === bubble.id ? "pop" : ""}`}
                style={{ left: bubble.left, top: bubble.top }}
                onClick={() => handleBubbleClick(bubble.id, bubble.answer)}
              >
                <span className="bubble-text">{bubble.answer}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="game-over-container">
          <div className="game-over-header">Game Over!</div>
          <div className="game-over-score">You Got: {score}</div>
          <div className="game-over-buttons">
            <button onClick={restartGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default BubblePopQuiz;
