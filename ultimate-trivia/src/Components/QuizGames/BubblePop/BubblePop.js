import React, { useState, useEffect, useMemo, useRef } from "react";
import "./BubblePop.css";
import { v4 as uuidv4 } from "uuid";
import useSound from "use-sound";
import { db } from "../../../Connection/firebaseConfig";
import { collection, getDocs, addDoc, query, where, updateDoc  } from "firebase/firestore";

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

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); 
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const levelId = localStorage.getItem("level_id");

        if (!levelId) {
          setError("Level not found.");
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
            id: doc.id,
            incorrect_answers: [
              data.option_a,
              data.option_b,
              data.option_c,
              data.option_d,
            ].filter((option) => option !== data.correct_answer),
          };
        });

        const shuffledQuestions = shuffle(loadedQuestions); 
        setQuestions(shuffledQuestions);
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
    const game_id = currentQuestion?.game_id;
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const timeTaken = 100 - timeLeft;
    const difficultyLevel = "medium";
    const dateTime = new Date();
  
    const scoresRef = collection(db, "userScores");
    const q = query(scoresRef, where("userId", "==", userId), where("game_id", "==", game_id));
  
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(scoresRef, {
          userId,
          game_id,
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
          if (doc.data().score < correctAnswers) { 
            await updateDoc(doc.ref, {
              score: correctAnswers,
              correctAnswers,
              incorrectAnswers,
              dateTime,
              timeTaken,
              difficultyLevel,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error updating/saving score:", error);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (questions.length === 0) {
    return <div>No questions available For Your Level.</div>;
  }

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
        <div className="FourPic-game-over">
        <h2>Game Over!</h2>
        <p>
          Your final score is: <span className="FourPic-score">{score} / {questions.length}</span>
        </p>
        <button
          onClick={restartGame}
          className="FourPic-play-again-button"
        >
          Play Again
        </button>
      </div>
      )}
    </div>
  );
});

export default BubblePopQuiz;
