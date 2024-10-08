import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, where, updateDoc } from "firebase/firestore";
import { db } from "../../../Connection/firebaseConfig";
import "./FillInTheBlank.css";

const FillInTheBlank = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [currentDay, setCurrentDay] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const gameId = 3;

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    setStartTime(new Date());
    const today = new Date().toISOString().split("T")[0];
    setCurrentDay(today);

    const fetchQuestions = async () => {
      setLoading(true);
      const levelId = localStorage.getItem("level_id");

      if (!levelId) {
        setError("Level not found.");
        setLoading(false);
        return;
      }

      try {
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

        if (questionsList.length === 0) {
          setError("No questions available for this level.");
        } else {
          questionsList = shuffle(questionsList); 
          setQuestions(questionsList);
        }
      } catch (fetchError) {
        setError("Failed to fetch questions.");
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswer = async () => {
    const trimmedAnswer = currentAnswer.trim();
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect =
      trimmedAnswer.toLowerCase() ===
      currentQuestion.correct_answer.toLowerCase();

    if (isCorrect) {
      setTotalCorrectAnswers((prev) => prev + 1);
    }

    setCurrentAnswer("");

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setEndTime(new Date());
      setQuizFinished(true);
    }
  };

  const saveScore = async (score) => {
    const userId = localStorage.getItem("user_id");
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const timeTaken = calculatePlaytime();
    const difficultyLevel = "medium";
    const dateTime = new Date();
  
    const scoresRef = collection(db, "userScores");
    const q = query(scoresRef, where("userId", "==", userId), where("game_id", "==", gameId));
  
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // No existing score, create new
        await addDoc(scoresRef, {
          userId,
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
      console.log("Score saved/updated successfully");
    } catch (error) {
      console.error("Error saving/updating score:", error);
    }
  };

  const calculatePlaytime = () => {
    if (startTime && endTime) {
      const playtime = Math.floor((endTime - startTime) / 1000);
      return playtime;
    }
    return 0;
  };

  useEffect(() => {
    if (quizFinished && endTime) {
      saveScore(totalCorrectAnswers);
    }
  }, [quizFinished, endTime]);

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setTotalCorrectAnswers(0);
    setQuizFinished(false);
    setStartTime(new Date());
    setEndTime(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div>
      {quizFinished ? (
        <div className="results">
          <h2 className="modal-header">Game Over!</h2>
          <h3>
            Total Score: {totalCorrectAnswers} / {questions.length}
          </h3>
          <p>Total Playtime: {calculatePlaytime()} seconds</p>
          <p>Played on: {currentDay}</p>
          <button className="play-again-button" onClick={handlePlayAgain}>
            Play Again
          </button>
        </div>
      ) : (
        <div>
          <p className="level">Level {currentQuestionIndex + 1}</p>
          <h2 className="current-question">{currentQuestion.question_text}</h2>
          <input
            type="text"
            className="input-answer"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
          />
          <button
            className="submit-button"
            onClick={handleAnswer}
            disabled={!currentAnswer.trim()}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default FillInTheBlank;
