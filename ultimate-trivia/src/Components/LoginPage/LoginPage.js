import React, { useState } from "react";
import "./LoginPage.css";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import Logo from "../Image/trivia-logo.png";
import { auth } from "../../Connection/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
  
      message.success("Sign up successful!");
    } catch (error) {
      console.error(error);
      message.error("Error during signup: " + error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        username,
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

        if (userData.profile_picture_url) {
          localStorage.setItem("profile_picture", userData.profile_picture_url);
        } else {
          localStorage.removeItem("profile_picture");
        }
        navigate("/dashboard");
      } else {
        message.error("No additional user details found.");
      }
    } catch (error) {
      message.error(
        "Login failed. Please check your credentials and try again."
      );
      console.error(error.message);
    }
  };

  return (
    <div className="main-container">
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
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
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
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <a href="#">Forget Your Password?</a>
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
                Register with your personal details to use all the site features{" "}
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
    </div>
  );
};

export default LoginPage;
