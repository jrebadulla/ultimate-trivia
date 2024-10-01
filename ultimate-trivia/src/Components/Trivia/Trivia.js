import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Connection/firebaseConfig"; // Ensure your Firebase configuration is correct
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import "./Trivia.css";

const Trivia = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null); // State for error handling
  const carouselRef = useRef(null);
  const listRef = useRef(null);
  const runningTimeRef = useRef(null);
  const timeRunning = 3000;
  const timeAutoNext = 50000;
  const name = localStorage.getItem("firstname");

  // Fetch trivia items from Firebase
  useEffect(() => {
    const fetchTrivia = async () => {
      const auth = getAuth();
      const user = auth.currentUser; // Check if the user is logged in

      if (!user) {
        console.error("User is not authenticated. Please log in.");
        // Handle unauthenticated user scenario (e.g., show an error message)
        return;
      }

      try {
        const triviaCollection = collection(db, "trivia");
        const triviaSnapshot = await getDocs(triviaCollection);
        const triviaList = triviaSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched Trivia List:", triviaList);
        setItems(triviaList);
      } catch (error) {
        console.error("Error fetching trivia items: ", error);
      }
    };

    fetchTrivia();
  }, []);

  // Carousel functionality
  useEffect(() => {
    const nextBtn = carouselRef.current.querySelector(".next");
    const prevBtn = carouselRef.current.querySelector(".prev");
    const runningTime = runningTimeRef.current;

    let runTimeOut;
    let runNextAuto = setTimeout(() => {
      nextBtn.click();
    }, timeAutoNext);

    const resetTimeAnimation = () => {
      runningTime.style.animation = "none";
      void runningTime.offsetHeight; // Trigger reflow
      runningTime.style.animation = "runningTime 7s linear 1 forwards";
    };

    const showSlider = (type) => {
      const sliderItemsDom = listRef.current.querySelectorAll(".item");

      if (sliderItemsDom.length === 0) {
        console.error("No slider items found.");
        return; // Exit early if no items are found
      }

      if (type === "next") {
        listRef.current.appendChild(sliderItemsDom[0]);
        carouselRef.current.classList.add("next");
      } else {
        listRef.current.prepend(sliderItemsDom[sliderItemsDom.length - 1]);
        carouselRef.current.classList.add("prev");
      }

      clearTimeout(runTimeOut);
      runTimeOut = setTimeout(() => {
        carouselRef.current.classList.remove("next");
        carouselRef.current.classList.remove("prev");
      }, timeRunning);

      clearTimeout(runNextAuto);
      runNextAuto = setTimeout(() => {
        nextBtn.click();
      }, timeAutoNext);

      resetTimeAnimation();
    };

    nextBtn.onclick = () => {
      showSlider("next");
    };

    prevBtn.onclick = () => {
      showSlider("prev");
    };
    resetTimeAnimation();
    return () => {
      clearTimeout(runTimeOut);
      clearTimeout(runNextAuto);
    };
  }, [items]);

  return (
    <div className="carousel" ref={carouselRef}>
    {error && <div className="error">{error}</div>}
    <div className="list" ref={listRef}>
      {items.map((item) => (
        <div
          className="item"
          key={item.id}
          style={{ backgroundImage: `url(${item.image})` }}
        >
          <div className="content">
            <div className="content-inner">
              <div className="trivia-text-container">
                <p className="trivia">
                  <span>Hey {name}!</span> Are you ready for something new? 🔍
                </p>
              </div>
              <div className="des1">
                <div className="did-you-know">Did you know?</div>
                <span>{item.title}</span> {item.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  
    <div className="arrows">
      <button className="prev">{"<"}</button>
      <button className="next">{">"}</button>
    </div>
  
    <div className="timeRunning" ref={runningTimeRef}></div>
  </div>
  );
};

export default Trivia;
