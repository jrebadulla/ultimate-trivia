import React, { useState, useEffect, useRef } from "react";
import "./QuizDashboard.css";
import BubblePopQuiz from "../BubblePop/BubblePop";
import MultipleChoice from "../MultipleChoice/MultipleChoice";
import FillInTheBlank from "../FillInTheBlank/FillInTheBlank";
import TypingGame from "../TypingGame/TypingGame";
import FourPicsOneWord from "../FourPicOneWord/FourPicOneWord";

const QuizDashboard = () => {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const audioRef = useRef(null);
  const levelId = localStorage.getItem("level_id");

  let yearMessage;
  switch (levelId) {
    case "1":
      yearMessage = "You're answering a First Year question.";
      break;
    case "2":
      yearMessage = "You're answering a Second Year question.";
      break;
    case "3":
      yearMessage = "You're answering a Third Year question.";
      break;
    case "4":
      yearMessage = "You're answering a Fourth Year question.";
      break;
    default:
      yearMessage = "Invalid level. Please select a valid year.";
  }

  useEffect(() => {
    createParticles();
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (activeQuiz) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }
  }, [activeQuiz]);

  const createParticles = () => {
    const container = document.querySelector(".particles");
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
      container.appendChild(particle);
    }
  };

  const handleQuizClick = (quizName) => {
    setActiveQuiz((prevQuiz) => (prevQuiz !== quizName ? quizName : null));
  };

  const handleCloseModal = () => {
    setActiveQuiz(null);
  };

  return (
    <div className="quiz-container">
      <audio ref={audioRef} loop>
        <source src="/sounds/background-music.mp3" type="audio/mpeg" />
        Your browser does not support the audio tag.
      </audio>
      <div className="particles"></div>
      <div className="quizes-container">
        <div onClick={() => handleQuizClick("Multiple Choice")}>
          Multiple Choice
        </div>
        <div onClick={() => handleQuizClick("Fill in the Blanks")}>
          Fill In The Blank
        </div>
        <div onClick={() => handleQuizClick("Bubble Pop Quiz")}>Bubble Pop</div>
        <div onClick={() => handleQuizClick("Four Pics One Word")}>
          Four Pics One Word
        </div>
        <div onClick={() => handleQuizClick("Typing Game")}>Typing</div>
      </div>

      {activeQuiz && (
        <div className={`quiz-modal ${activeQuiz ? "active" : ""}`}>
          <button className="close-button" onClick={handleCloseModal}>
            ×
          </button>
          <div className="modal-header">{activeQuiz}</div>
          <p className="info-message">{yearMessage}</p>
          <div className="modal-debug">
            {activeQuiz === "Bubble Pop Quiz" ? (
              <BubblePopQuiz />
            ) : activeQuiz === "Multiple Choice" ? (
              <MultipleChoice />
            ) : activeQuiz === "Fill in the Blanks" ? (
              <FillInTheBlank />
            ) : activeQuiz === "Typing Game" ? (
              <TypingGame />
            ) : activeQuiz === "Four Pics One Word" ? (
              <FourPicsOneWord />
            ) : (
              <p>This is where you play the {activeQuiz} quiz!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizDashboard;
