import React, { useState, useRef, useEffect } from "react";
import "./AdminManagement.css";
import { getAuth } from "firebase/auth";
import { db } from "../../Connection/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { message } from "antd";

const Manage = () => {
  const [formData, setFormData] = useState({
    id: null,
    image: null,
    title: "",
    description: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [triviaList, setTriviaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

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
    }
  }, [userRole]);

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
        const storage = getStorage();
        const storageRef = ref(storage, `trivia-images/${formData.image.name}`);
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

  return (
    <div className="manage-admin-management-dashboard">
      <div className="manage-sidebar">
        <button
          className="manage-add-trivia"
          onClick={() => setShowModal(true)}
        >
          Add New Trivia
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
                    <button onClick={() => handleEdit(trivia)}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(trivia.id)}>
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
      </div>
    </div>
  );
};

export default Manage;
