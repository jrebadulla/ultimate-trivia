import React, { useState } from "react";
import './LoginPage.css'
import { UserOutlined } from "@ant-design/icons";
import { Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import Logo from "../Image/trivia-logo.png";
import { auth } from "../../Connection/firebaseConfig.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
      // Firebase signup with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      message.success("Sign up successful!");
      console.log(user);

      // Navigate to dashboard or another page after successful sign up
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      message.error("Error during signup: " + error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      // Firebase login with email and password
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;

      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: user.uid,
          email: user.email,
        })
      );

      // Navigate to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      message.error("Login failed. Please check your credentials and try again.");
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
              type="firstname"
              placeholder="Name"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              required
            />
            <input
              type="lastname"
              placeholder="Last Name"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              required
            />
            <input
              type="username"
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
              <img src={imagePreview} alt="Preview" className="upload-preview" />
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
              <img src={Logo} />
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all the site features </p>
              <button className="hidden" id="login" onClick={handleClick}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <img src={Logo} />
              <h1>Welcome, To Ultimate Trivia!</h1>
              <p>Register with your personal details to use all the site features </p>
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
