import React, { useState, useRef } from "react";
import "./Tutorial.css";
import Js from '../Videos/Js.mp4'

const videoData = [
  { src: Js, title: "Learn JavaScript" },
  { src: Js, title: "Learn CSS" },
  { src: Js, title: "Learn HTML" },
  { src: Js, title: "Learn React" },
  { src: Js, title: "Learn React" },
];

const Tutorials = () => {
  const videoRefs = useRef([]);
  const [isPlaying, setIsPlaying] = useState(videoData.map(() => false)); 

  const handlePlay = (index) => {
    videoRefs.current[index].play();
    const updatedPlayState = [...isPlaying];
    updatedPlayState[index] = true; 
    setIsPlaying(updatedPlayState);
  };

  const handleVideoEnded = (index) => {
    const updatedPlayState = [...isPlaying];
    updatedPlayState[index] = false; 
    setIsPlaying(updatedPlayState);
  };

  return (
    <div className="tutorial-container">
      <h2>Tutorials</h2>
      <div className="video-container">
        {videoData.map((video, index) => (
          <div className="video-item" key={index}>
            <div className="video-wrapper">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                controls
                poster="/path/to/your/thumbnail.png"
                onEnded={() => handleVideoEnded(index)} 
              >
                <source src={video.src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {!isPlaying[index] && ( 
                <button
                  className="play-btn"
                  onClick={() => handlePlay(index)}
                >
                  ▶
                </button>
              )}
            </div>
            <p className="title-video">{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tutorials;
