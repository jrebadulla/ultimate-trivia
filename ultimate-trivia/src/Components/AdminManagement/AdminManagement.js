import React, { useState, useRef, useEffect } from "react";
import ReactPaginate from "react-paginate";
import "./AdminManagement.css";
import { Input, Modal } from "antd";
import { getAuth } from "firebase/auth";
import { db } from "../../Connection/firebaseConfig";
import {
  
  CloseCircleOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { message } from "antd";

const Manage = () => {
  const storage = getStorage();
  const [formData, setFormData] = useState({
    id: null,
    image: null,
    title: "",
    description: "",
  });

  const [questionData, setQuestionData] = useState({
    question_id: "",
    game_id: "",
    question_text: "",
    level_id: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [triviaList, setTriviaList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreviews, setImagePreviews] = useState({});
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [title, setTitle] = useState("");
  const [tutorialList, setTutorialList] = useState([]);
  const [editingTutorialId, setEditingTutorialId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const filteredQuestions = questionList.filter((question) => {
    const questionTextMatches = question.question_text
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const gameIdMatches = question.game_id
      .toString()
      .includes(searchQuery.toLowerCase());
    return questionTextMatches || gameIdMatches;
  });

  const pageCount = Math.ceil(filteredQuestions.length / itemsPerPage);

  const paginatedQuestions = filteredQuestions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchTrivia();
      fetchQuestions();
      fetchTutorials();
    }
  }, [userRole]);

  const fetchTutorials = async () => {
    try {
      const tutorialsCollection = collection(db, "tutorial-videos");
      const tutorialSnapshot = await getDocs(tutorialsCollection);

      const tutorialList = await Promise.all(
        tutorialSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const videoRef = ref(storage, data.videoPath);
          const videoUrl = await getDownloadURL(videoRef);

          return {
            id: doc.id,
            videoUrl,
            title: data.title,
            videoPath: data.videoPath,
          };
        })
      );

      setTutorialList(tutorialList);
    } catch (error) {
      console.error("Error fetching tutorials: ", error);
    }
  };

  async function getUserRole() {
    const user = getAuth().currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        return userData.role;
      } else {
        console.log("No such user document!");
        return null;
      }
    }
    return null;
  }

  const fetchTrivia = async () => {
    const triviaCollection = collection(db, "trivia");
    const triviaSnapshot = await getDocs(triviaCollection);
    const triviaList = triviaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTriviaList(triviaList);
  };

  const fetchQuestions = async () => {
    try {
      const questionsCollection = collection(db, "questions");
      const questionSnapshot = await getDocs(questionsCollection);
      const questionList = questionSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestionList(questionList);
      console.log(questionList);
    } catch (error) {
      console.error("Error fetching questions: ", error);
    }
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFormData({ ...formData, image: selectedFile });
      setImagePreview(URL.createObjectURL(selectedFile));
    } else {
      message.error("Please upload a valid image file.");
      setFormData({ ...formData, image: null });
      setImagePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id && !formData.image) {
      message.error("Please upload an image.");
      fileInputRef.current.focus();
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      message.error("Title and description cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      if (formData.image) {
        const storageRef = ref(
          getStorage(),
          `trivia-images/${formData.image.name}`
        );
        await uploadBytes(storageRef, formData.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (formData.id) {
        const updatedData = {
          title: formData.title || "Untitled",
          description: formData.description || "No description",
        };

        if (imageUrl) {
          updatedData.image = imageUrl;
        }

        await updateDoc(doc(db, "trivia", formData.id), updatedData);
        message.success("Trivia updated successfully!");
      } else {
        await addDoc(collection(db, "trivia"), {
          image: imageUrl,
          title: formData.title || "Untitled",
          description: formData.description || "No description",
          createdAt: new Date(),
        });
        message.success("Trivia added successfully!");
      }

      resetForm();
      fetchTrivia();
    } catch (error) {
      console.error("Error:", error.message);
      message.error(`Error adding/updating trivia: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trivia) => {
    setFormData({
      id: trivia.id,
      image: null,
      title: trivia.title,
      description: trivia.description,
    });
    setImagePreview(trivia.image);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this trivia?")) {
      await deleteDoc(doc(db, "trivia", id));
      message.success("Trivia deleted successfully!");
      fetchTrivia();
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowModal(false);
    fileInputRef.current.focus();
  };

  const resetForm = () => {
    setFormData({ id: null, image: null, title: "", description: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleQuestionImageChange = (e, picKey) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setQuestionData((prev) => ({ ...prev, [picKey]: selectedFile }));
      setImagePreviews((prev) => ({
        ...prev,
        [picKey]: URL.createObjectURL(selectedFile),
      }));
    } else {
      message.error("Please upload a valid image file.");
      setQuestionData((prev) => ({ ...prev, [picKey]: null }));
      setImagePreviews((prev) => ({ ...prev, [picKey]: null }));
    }
  };

  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionData({ ...questionData, [name]: value });
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    try {
      const uploadedImageURLs = {};
      const imageFields = ["image1", "image2", "image3", "image4"];
      for (const imageField of imageFields) {
        const file = questionData[imageField];
        if (file) {
          const storageRef = ref(
            storage,
            `four-pic-one-word-images/${imageField}_${file.name}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          uploadedImageURLs[imageField] = downloadURL;
        }
      }

      const updatedQuestionData = {
        ...questionData,
        game_id: Number(questionData.game_id),
        question_id: Number(questionData.question_id),
        level_id: Number(questionData.level_id),
        ...uploadedImageURLs,
      };

      if (questionData.id) {
        await updateDoc(
          doc(db, "questions", questionData.id),
          updatedQuestionData
        );
        message.success("Question updated successfully!");
      } else {
        const docRef = await addDoc(
          collection(db, "questions"),
          updatedQuestionData
        );
        console.log("New document added with ID:", docRef.id);
        message.success("Question added successfully!");

        setQuestionData((prev) => ({ ...prev, id: docRef.id }));
      }

      setShowQuestionModal(false);
      fetchQuestions();

      setQuestionData({
        question_id: "",
        game_id: "",
        question_text: "",
        level_id: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "",
        image1: null,
        image2: null,
        image3: null,
        image4: null,
      });
    } catch (error) {
      console.error("Error:", error.message);
      message.error(`Error adding/updating question: ${error.message}`);
    }
  };

  const handleEditQuestion = (question) => {
    setQuestionData({
      id: question.id,
      question_id: question.id,
      game_id: question.game_id,
      question_text: question.question_text,
      level_id: question.level_id,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
    setImagePreviews({
      image1: question.image1,
      image2: question.image2,
      image3: question.image3,
      image4: question.image4,
    });
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Are you sure you want to delete this trivia?")) {
      await deleteDoc(doc(db, "questions", id));
      message.success("Question deleted successfully!");
      fetchQuestions();
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadSuccess(false);
  };

  const uploadVideo = async (file, title) => {
    if (!file && !title) {
      alert("Please provide a title or select a video file.");
      return;
    }

    setIsLoading(true);
    setUploadSuccess(false);

    let videoUrl = null;

    if (file) {
      const storageRef = ref(storage, `tutorial-videos/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          () => {},
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          },
          async () => {
            videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          }
        );
      });
    }

    const videoData = {
      videoPath: videoUrl
        ? `tutorial-videos/${file.name}`
        : tutorialList.find((t) => t.id === editingTutorialId)?.videoPath,
      title: title || "Untitled Video",
    };

    try {
      if (editingTutorialId) {
        await updateDoc(
          doc(db, "tutorial-videos", editingTutorialId),
          videoData
        );
        message.success("Tutorial updated successfully!");
        setEditingTutorialId(null); // Reset edit mode
      } else {
        await setDoc(doc(db, "tutorial-videos", file.name), videoData);
        message.success("Video uploaded successfully!");
      }

      fetchTutorials(); // Refresh tutorial list
      setShowTutorialModal(false); // Close modal
    } catch (error) {
      console.error("Error saving video metadata:", error);
      message.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTutorial = (tutorial) => {
    setTitle(tutorial.title);
    setFile(null);
    setShowTutorialModal(true);
    setEditingTutorialId(tutorial.id);
  };

  const handleDeleteTutorial = async (id, videoPath) => {
    if (window.confirm("Are you sure you want to delete this tutorial?")) {
      try {
        await deleteDoc(doc(db, "tutorial-videos", id));

        const storageRef = ref(storage, videoPath);
        await deleteObject(storageRef);

        message.success("Tutorial deleted successfully!");
        fetchTutorials();
      } catch (error) {
        console.error("Error deleting tutorial: ", error);
        message.error("Failed to delete tutorial.");
      }
    }
  };

  return (
    <div className="manage-admin-management-dashboard">
      <div className="manage-sidebar">
        <button
          className="manage-add-trivia"
          onClick={() => setShowModal(true)}
        >
          Add New Trivia
        </button>

        <button
          className="add-question"
          onClick={() => setShowQuestionModal(true)}
        >
          Add question
        </button>
        <button
          className="add-video"
          onClick={() => setShowTutorialModal(true)}
        >
          Add New Toturial
        </button>
      </div>
      <div className="manage-main-content">
        {showModal && (
          <>
            <div className="manage-modal-overlay" onClick={handleCancel}></div>
            <div className="manage-modal">
              <form className="manage-trivia-form" onSubmit={handleSubmit}>
                <label htmlFor="image">Upload Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  id="image"
                  name="image"
                  required={!formData.id}
                />

                {imagePreview && (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        marginTop: "10px",
                        borderRadius: "5px",
                      }}
                    />
                  </div>
                )}

                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  id="title"
                />

                <label htmlFor="description">Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  id="description"
                />
                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading
                      ? "Processing..."
                      : formData.id
                      ? "Update Trivia"
                      : "Add Trivia"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {showQuestionModal && (
          <>
            <div
              className="manage-modal-overlay"
              onClick={() => setShowQuestionModal(false)}
            ></div>
            <div className="manage-modal">
              <form
                className="manage-question-form"
                onSubmit={handleQuestionSubmit}
              >
                <label htmlFor="game_id">Game ID:</label>
                <input
                  type="text"
                  name="game_id"
                  value={questionData.game_id}
                  onChange={handleQuestionInputChange}
                  required
                  id="game_id"
                />
                <label htmlFor="question_text">Question Text:</label>
                <input
                  type="text"
                  name="question_text"
                  value={questionData.question_text}
                  onChange={handleQuestionInputChange}
                  required
                  id="question_text"
                />
                <label htmlFor="level_id">Required Student Level:</label>
                <input
                  type="text"
                  name="level_id"
                  value={questionData.level_id}
                  onChange={handleQuestionInputChange}
                  required
                  id="level_id"
                />
                <label htmlFor="option_a">Option A:</label>
                <input
                  type="text"
                  name="option_a"
                  value={questionData.option_a}
                  onChange={handleQuestionInputChange}
                  id="option_a"
                />

                <label htmlFor="option_b">Option B:</label>
                <input
                  type="text"
                  name="option_b"
                  value={questionData.option_b}
                  onChange={handleQuestionInputChange}
                  id="option_b"
                />

                <label htmlFor="option_c">Option C:</label>
                <input
                  type="text"
                  name="option_c"
                  value={questionData.option_c}
                  onChange={handleQuestionInputChange}
                  id="option_c"
                />

                <label htmlFor="option_d">Option D:</label>
                <input
                  type="text"
                  name="option_d"
                  value={questionData.option_d}
                  onChange={handleQuestionInputChange}
                  id="option_d"
                />

                <label htmlFor="correct_answer">Correct Answer:</label>
                <input
                  type="text"
                  name="correct_answer"
                  value={questionData.correct_answer}
                  onChange={handleQuestionInputChange}
                  required
                  id="correct_answer"
                />
                <label htmlFor="image1">Upload Picture 1:</label>
                <input
                  id="image1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuestionImageChange(e, "image1")}
                />
                {imagePreviews.image1 && (
                  <img
                    id="image1"
                    src={imagePreviews.image1}
                    alt="Preview of Pic One"
                    width={100}
                  />
                )}
                <label htmlFor="image2">Upload Picture 2:</label>
                <input
                  id="image2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuestionImageChange(e, "image2")}
                />
                {imagePreviews.image2 && (
                  <img
                    src={imagePreviews.image2}
                    alt="Preview of Pic Two"
                    width={100}
                  />
                )}
                <label htmlFor="image3">Upload Picture 3:</label>
                <input
                  id="image3"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuestionImageChange(e, "image3")}
                />
                {imagePreviews.image3 && (
                  <img
                    src={imagePreviews.image3}
                    alt="Preview of Pic Three"
                    width={100}
                  />
                )}
                <label htmlFor="image4">Upload Picture 4:</label>
                <input
                  id="image4"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuestionImageChange(e, "image4")}
                />
                {imagePreviews.image4 && (
                  <img
                    src={imagePreviews.image4}
                    alt="Preview of Pic Four"
                    width={100}
                  />
                )}

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {questionData.id ? "Update Question" : "Add Question"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowQuestionModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {showTutorialModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p className="text">Upload Tutorial Video</p>
              <input
                className="title-toturial"
                placeholder="Video Title"
                id="video-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="upload-input">
                <label htmlFor="tutorial">
                  Select Video <UploadOutlined className="outlined" />
                </label>
                <input
                  className="upload-vid"
                  id="tutorial"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </div>
              {isLoading && (
                <div className="loading-indicator">Uploading...</div>
              )}
              {uploadSuccess && (
                <div className="success-indicator">Upload Successful!</div>
              )}
              <div className="tutotial-vid">
                <button
                  className="add"
                  onClick={() => uploadVideo(file, title)}
                >
                  {editingTutorialId ? "Update Video" : "Upload"}
                </button>

                <button
                  className="close"
                  onClick={() => setShowTutorialModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="manage-trivia-list manage-card">
          <h3>Existing Trivia</h3>
          {triviaList.length > 0 ? (
            <ul className="manage-trivia-items">
              {triviaList.map((trivia) => (
                <li key={trivia.id} className="manage-trivia-item">
                  <img src={trivia.image} alt={trivia.title} />
                  <div className="manage-trivia-info">
                    <h4>{trivia.title}</h4>
                    <p>{trivia.description}</p>
                    <button className="edit-btn" onClick={() => handleEdit(trivia)}>Edit</button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(trivia.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No trivia available.</p>
          )}
        </div>

        <div className="manage-question-list manage-card">
          <h3>Existing Questions</h3>
          <Input
            type="text"
            placeholder="Search by question or game ID"
            value={searchQuery}
            allowClear
            onChange={handleSearchChange}
            className="search-question"
            prefix={<SearchOutlined />}
          />
          {paginatedQuestions.length > 0 ? (
            <ul className="manage-question-items">
              {paginatedQuestions.map((question) => (
                <li key={question.id} className="manage-question-item">
                  <h4>{question.question_text}</h4>
                  <h3>Game ID: {question.game_id}</h3>
                  <div>
                    <button className="edit-btn" onClick={() => handleEditQuestion(question)}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No questions available.</p>
          )}
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            breakClassName={"break-me"}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={"pagination"}
            pageClassName={"page-item"}
            pageLinkClassName={"page-link"}
            previousClassName={"page-item"}
            previousLinkClassName={"page-link"}
            nextClassName={"page-item"}
            nextLinkClassName={"page-link"}
            activeClassName={"active"}
            disabledClassName={"disabled"}
          />
        </div>

        <div className="manage-tutorial-list manage-card">
          <h3>Existing Tutorials</h3>
          {tutorialList.length > 0 ? (
            <ul className="manage-tutorial-items">
              {tutorialList.map((tutorial) => (
                <li
                  key={tutorial.id}
                  className="manage-tutorial-item tutorial-card"
                >
                  <div className="tutorial-video-wrapper">
                    <video controls src={tutorial.videoUrl}>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <h4 className="tutorial-title">{tutorial.title}</h4>
                  <div className="tutorial-actions">
                    <button
                      onClick={() => handleEditTutorial(tutorial)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDeleteTutorial(tutorial.id, tutorial.videoPath)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tutorials available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Manage;
