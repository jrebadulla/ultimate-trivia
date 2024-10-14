import React, { useState, useRef, useEffect } from "react";
import { db } from "../../Connection/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, getDownloadURL, ref } from "firebase/storage";
import { Input } from "antd"; 
import "./Tutorial.css";

const { Search } = Input; 

const Tutorials = () => {
  const videoRefs = useRef([]);
  const [videos, setVideos] = useState([]);
  const [isPlaying, setIsPlaying] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [durations, setDurations] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const storage = getStorage();

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const videoCollection = collection(db, "tutorial-videos");
        const videoSnapshot = await getDocs(videoCollection);
        const videoList = await Promise.all(
          videoSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const videoRef = ref(storage, data.videoPath);
            const url = await getDownloadURL(videoRef);

            return {
              id: doc.id,
              url,
              thumbnail: data.thumbnail,
              title: data.title,
            };
          })
        );

        setVideos(videoList);
        setIsPlaying(new Array(videoList.length).fill(false));
      } catch (error) {
        console.error("Error fetching videos: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

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

  const handleMetadataLoad = (index, event) => {
    const duration = event.target.duration;
    const updatedDurations = [...durations];
    updatedDurations[index] = duration;
    setDurations(updatedDurations);
  };

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = entry.target.dataset.index;
          const videoElement = videoRefs.current[index];
          if (videoElement && !videoElement.src) {
            videoElement.src = entry.target.dataset.src;
          }
        }
      });
    });

    videoRefs.current.forEach((ref, index) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  return (
    <div className="tutorial-container">
      <div className="fixed-tutorial-header">
        <h1>Tutorials</h1>
        <Search
          placeholder="Search tutorials"
          enterButton
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          allowClear
        />
      </div>

      {isLoading && (
        <div className="video-container">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="skeleton"></div>
            ))}
        </div>
      )}

      <div className="video-container">
        {filteredVideos.map((video, index) => (
          <div className="video-item" key={video.id}>
            <div className="video-wrapper">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                onLoadedMetadata={(e) => handleMetadataLoad(index, e)}
                poster={video.thumbnail || "path/to/default-poster.jpg"}
                data-src={video.url}
                data-index={index}
                controls
                onEnded={() => handleVideoEnded(index)}
              >
                <source type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {!isPlaying[index] && (
                <button
                  className="play-btn"
                  aria-label="Play video"
                  onClick={() => handlePlay(index)}
                  aria-keyshortcuts="Space" 
                >
                  ▶
                </button>
              )}
            </div>
            <p className="title-video">{video.title || "Untitled Video"}</p>
            <span className="duration">
              {durations[index]
                ? `${Math.floor(durations[index] / 60)}:${Math.floor(
                    durations[index] % 60
                  )}`
                : "Loading..."}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tutorials;
