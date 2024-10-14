import React, { useState } from "react";
import "./LoginPage.css";
import { message, Modal, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import Logo from "../Image/trivia-logo.png";
import { auth } from "../../Connection/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";
import { db } from "../../Connection/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const LoginPage = () => {
  const [isActive, setIsActive] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    username: "",
    level_id: "",
    profile_picture: null,
  });

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [emailForReset, setEmailForReset] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [loadingSignUp, setLoadingSignUp] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      profile_picture: file,
    });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterClick = () => {
    setIsActive(true);
  };

  const handleClick = () => {
    setIsActive(false);
  };

  const uploadProfilePicture = async (file, userId) => {
    if (!file || !userId) {
      console.error("File or User ID is undefined.");
      return;
    }
    const storage = getStorage();
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoadingSignUp(true);
    const {
      email,
      password,
      firstname,
      lastname,
      username,
      level_id,
      profile_picture,
    } = formData;

    try {
      const userIdDocRef = doc(db, "counters", "user_id_counter");
      const userIdDoc = await getDoc(userIdDocRef);

      let newUserId = 1;

      if (userIdDoc.exists()) {
        newUserId = userIdDoc.data().currentId + 1;
        await setDoc(userIdDocRef, { currentId: newUserId });
      } else {
        await setDoc(userIdDocRef, { currentId: newUserId });
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      let profilePicUrl = "";
      if (profile_picture) {
        profilePicUrl = await uploadProfilePicture(profile_picture, user.uid);
      }

      await setDoc(doc(db, "users", user.uid), {
        user_id: newUserId,
        firstname,
        lastname,
        username,
        level_id,
        email,
        profile_picture_url: profilePicUrl,
        createdAt: new Date(),
      });
      setLoadingSignUp(false);
      message.success({
        content: "Sign up successful! 🎉 You can now sign in to your account.",
        duration: 3,
      });
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.message || "An unexpected error occurred during signup.";

      if (error.response && error.response.status === 400) {
        message.error(
          "Sign up failed: Invalid information. Please check your details and try again."
        );
      } else if (error.response && error.response.status === 500) {
        message.error(
          "Server error: We're experiencing issues right now. Please try again later."
        );
      } else {
        message.error(
          `Sign up failed: ${errorMsg}. Please try again or contact support if the issue persists.`
        );
      }
      setLoadingSignUp(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoadingSignIn(true);
    try {
      let emailOrUsername = username;
      let emailToUse = emailOrUsername;

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername);

      if (!isEmail) {
        const userQuerySnapshot = await getDocs(
          query(
            collection(db, "users"),
            where("username", "==", emailOrUsername)
          )
        );

        if (!userQuerySnapshot.empty) {
          const userDoc = userQuerySnapshot.docs[0];
          emailToUse = userDoc.data().email;
        } else {
          message.error({
            content:
              "Username or Email not found. Please check your username or sign up for a new account.",
            duration: 3,
          });
          setLoadingSignIn(false);
          return;
        }
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailToUse,
        password
      );
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        localStorage.setItem("firstname", userData.firstname);
        localStorage.setItem("lastname", userData.lastname);
        localStorage.setItem("user_id", userData.user_id);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("level_id", userData.level_id);
        if (userData.profile_picture_url) {
          localStorage.setItem("profile_picture", userData.profile_picture_url);
        } else {
          localStorage.removeItem("profile_picture");
        }
        setLoadingSignIn(false);
        navigate("/dashboard");
      } else {
        message.error("No additional user details found.");
      }
    } catch (error) {
      message.error(
        "Login failed. Please check your credentials and try again."
      );
      setLoadingSignIn(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!emailForReset) {
      message.error("Please enter your email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, emailForReset);
      message.success(
        "Success! A password reset email has been sent. Please check your inbox to reset your password."
      );
      setIsResetModalVisible(false);
      setEmailForReset("");
    } catch (error) {
      console.error(error);
      message.error("Error sending password reset email: " + error.message);
    }
  };

  const showResetModal = () => {
    setIsResetModalVisible(true);
  };

  const handleCancel = () => {
    setIsResetModalVisible(false);
    setEmailForReset("");
  };

  return (
    <div className="main-container">
      <Spin spinning={loadingSignIn || loadingSignUp}>
        <div className={`container ${isActive ? "active" : ""}`} id="container">
          <div className="form-container sign-up">
            <form>
              <br></br>
              <div className="social-icons">
                <a href="#" className="icon"></a>
              </div>
              <input
                type="text"
                placeholder="First Name"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>
              <select
                name="level_id"
                value={formData.level_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Your Year Level</option>
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
              </select>
              <label className="upload-btn" htmlFor="file-upload">
                Upload Profile Picture
              </label>
              <input
                type="file"
                id="file-upload"
                name="profile_picture"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="upload-preview"
                />
              )}
              <button onClick={handleSignUp}>Sign Up</button>
            </form>
          </div>
          <div className="form-container sign-in">
            <form>
              <h1>Sign In</h1>
              <br></br>
              <div className="social-icons">
                <a href="#" className="icon"></a>
              </div>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email or Username"
                required
              />
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <span
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>

              <a className="forget-pass" href="#" onClick={showResetModal}>
                Forget Your Password?
              </a>
              <button onClick={handleSignIn}>Login</button>
            </form>
          </div>
          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-left">
                <img src={Logo} alt="logo" />
                <h1>Welcome Back!</h1>
                <p>Enter your personal details to use all the site features </p>
                <button className="hidden" id="login" onClick={handleClick}>
                  Sign In
                </button>
              </div>
              <div className="toggle-panel toggle-right">
                <img src={Logo} alt="logo" />
                <h1>Welcome, To Ultimate Trivia!</h1>
                <p>
                  Register with your personal details to use all the site
                  features{" "}
                </p>
                <button
                  className="hidden"
                  id="register"
                  onClick={handleRegisterClick}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </Spin>
      <Modal
        title="Reset Your Password"
        visible={isResetModalVisible}
        onOk={handlePasswordReset}
        onCancel={handleCancel}
        okText="Send Reset Email"
      >
        <input
          type="email"
          placeholder="Enter your email"
          value={emailForReset}
          onChange={(e) => setEmailForReset(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginTop: "10px" }}
        />
      </Modal>
    </div>
  );
};

export default LoginPage;
