import React, { useEffect, useState } from "react";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { db } from "../../Connection/firebaseConfig";
import { message } from "antd";
import { sendPasswordResetEmail } from "firebase/auth";

import "./UserProfile.css";

const UserProfile = () => {
  const auth = getAuth();
  const storage = getStorage();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    level_id: "",
    profile_picture: "",
    email: "",
    password: "",
    currentPassword: "",
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserData();
    } else {
      message.error("User is not logged in.");
    }
  }, [auth.currentUser]);

  useEffect(() => {
    localStorage.setItem("firstname", formData.firstname);
    localStorage.setItem("lastname", formData.lastname);
    localStorage.setItem("level_id", formData.level_id);
    localStorage.setItem("profile_picture", formData.profile_picture);
  }, [
    formData.firstname,
    formData.lastname,
    formData.level_id,
    formData.profile_picture,
  ]);

  const fetchUserData = async () => {
    setLoading(true);
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      setUser(userData);
      setFormData({
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.username,
        level_id: userData.level_id,
        profile_picture: userData.profile_picture_url || "",
        email: userData.email || "",
        password: "",
      });
      setProfilePicturePreview(userData.profile_picture_url || "");
    } else {
      console.log("No such document!");
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowSpinner(true);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      message.error("User is not authenticated.");
      setLoading(false);
      setShowSpinner(false);
      return;
    }

    const userId = currentUser.uid;
    const userRef = doc(db, "users", userId);
    let newProfilePictureUrl = formData.profile_picture;

    try {
      if (formData.profile_picture instanceof File) {
        const storageRef = ref(
          storage,
          `profile_pictures/${formData.profile_picture.name}`
        );
        await uploadBytes(storageRef, formData.profile_picture);
        newProfilePictureUrl = await getDownloadURL(storageRef);
      }

      const updatedData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        username: formData.username,
        level_id: formData.level_id,
        profile_picture_url: newProfilePictureUrl || formData.profile_picture,
        updatedAt: new Date(),
        email: formData.email,
      };

      await setDoc(userRef, updatedData, { merge: true });

      if (currentUser.email !== formData.email) {
        await currentUser.updateEmail(formData.email);
      }

      if (formData.password && formData.currentPassword) {
        console.log(`Reauthenticating with email: ${currentUser.email}`);
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          formData.currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential)
          .then(() => {
            console.log("Reauthentication successful");
            return updatePassword(currentUser, formData.password);
          })
          .then(() => {
            message.success("Password updated successfully!");
          });
      }

      message.success("Profile updated successfully!");
      await fetchUserData();
      window.location.reload();
    } catch (error) {
      console.error("Error updating user info:", error);
      message.error(
        "Failed to update profile. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
      setShowSpinner(false);
      setIsEditing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_picture: file });
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  };

  const levelMapping = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
  };

  const yearLevels = [
    { value: 1, label: "First Year" },
    { value: 2, label: "Second Year" },
    { value: 3, label: "Third Year" },
    { value: 4, label: "Fourth Year" },
  ];

  const handleForgotPassword = async (email) => {
    const auth = getAuth();
    return sendPasswordResetEmail(auth, email)
      .then(() => {
        message.success({
          content: "Password reset email sent! Please check your inbox.",
          duration: 5,
        });
      })
      .catch((error) => {
        console.error("Failed to send password reset email:", error);
        message.error(
          "Failed to send password reset email. Please try again later."
        );
      });
  };

  return (
    <div className="user-profile-container">
      {showSpinner && <div className="spinner"></div>}
      <h2>User Profile</h2>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div className="profile-info">
          <img
            src={profilePicturePreview}
            alt={`${formData.firstname} ${formData.lastname}`}
            className="profile-picture"
          />
          <div className="user-details">
            <p>
              <strong>First Name:</strong> <span>{formData.firstname}</span>
            </p>
            <p>
              <strong>Last Name:</strong> <span> {formData.lastname}</span>
            </p>
            <p>
              <strong>Username:</strong> <span> {formData.username}</span>
            </p>
            <p>
              <strong>Year Level:</strong>{" "}
              <span>  {levelMapping[formData.level_id] || "N/A"}</span>
            </p>
            <p>
              <strong>Email:</strong> <span> {formData.email}</span>
            </p>
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <p>No user data available.</p>
      )}
      {isEditing && (
        <div className="edit-profile-overlay">
          <form onSubmit={handleUpdate} className="edit-profile-form">
            <h4>Edit Profile</h4>
            {["firstname", "lastname", "username", "email"].map((field) => (
              <label key={field}>
                {field.charAt(0).toUpperCase() +
                  field.slice(1).replace("_", " ")}
                :
                <input
                  type="text"
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  required
                />
              </label>
            ))}

            <label>
              Year Level:
              <select
                className="select-year"
                value={formData.level_id}
                onChange={(e) =>
                  setFormData({ ...formData, level_id: e.target.value })
                }
                required
              >
                <option value="" disabled>
                  Select Year Level
                </option>
                {yearLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Current Password (for reauthentication):
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
              />
            </label>
            <button
              className="forget-pass-edit"
              onClick={() => handleForgotPassword(formData.email)}
            >
              Send a request to your email to change your password
            </button>

            <label>
              New Password (leave blank if not changing):
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </label>
            <label>
              Change Profile Picture
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            {profilePicturePreview && (
              <img
                src={profilePicturePreview}
                alt="Profile Preview"
                className="profile-picture-preview"
              />
            )}
            <div className="form-actions">
              <button type="submit" className="edit-ok">
                Update
              </button>
              <button
                type="button"
                className="edit-cancel"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
