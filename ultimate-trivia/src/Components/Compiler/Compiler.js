import React, { useState, useEffect } from "react";
import {
  ChakraProvider,
  Button,
  Select,
  Box,
  Flex,
  Text,
  theme,
} from "@chakra-ui/react";
import "./Compiler.css";
import MonacoEditor from "@monaco-editor/react";
import { executeCode } from "./Api";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "./Constant.js";
import { db } from "../../Connection/firebaseConfig.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
} from "firebase/firestore";

const Compiler = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(CODE_SNIPPETS["javascript"]);
  const [output, setOutput] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [timeSpent, setTimeSpent] = useState(0);
  const [practiceMessageVisible, setPracticeMessageVisible] = useState(false);
  const gameId = 6;

  useEffect(() => {
    const fetchQuestions = async () => {
      const levelId = localStorage.getItem("level_id");
      if (!levelId) {
        setError("Level ID is required.");
        setLoading(false);
        return;
      }

      if (parseInt(levelId) === 4) {
        setLoading(true);
        try {
          const q = query(
            collection(db, "questions"),
            where("game_id", "==", gameId),
            where("level_id", "==", parseInt(levelId))
          );
          const querySnapshot = await getDocs(q);
          const fetchedQuestions = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (fetchedQuestions.length === 0) {
            setError("No questions found for this level.");
            setLoading(false);
            return;
          }

          setQuestions(fetchedQuestions);
          setStartTime(Date.now());
          setLoading(false);
        } catch (fetchError) {
          console.error("Failed to fetch questions:", fetchError);
          setError("Failed to load questions.");
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (quizFinished) {
      const timeTaken = (Date.now() - startTime) / 1000;
      saveScore(timeTaken).catch(console.error);
    }
  }, [quizFinished, startTime, totalCorrectAnswers, questions.length]);

  const saveScore = async (timeTaken) => {
    const userId = localStorage.getItem("user_id");
    const levelId = localStorage.getItem("level_id");

    if (!userId || !levelId) {
      console.error("User ID or Level ID is missing.");
      return;
    }

    try {
      const scoresRef = collection(db, "userScores");
      const q = query(
        scoresRef,
        where("userId", "==", userId),
        where("game_id", "==", gameId),
        where("level_id", "==", parseInt(levelId)),
        where("languageUsed", "==", language)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(scoresRef, {
          correctAnswers: totalCorrectAnswers,
          incorrectAnswers: questions.length - totalCorrectAnswers,
          totalQuestions: questions.length,
          game_id: gameId,
          game_name: "Compiler Game",
          level_id: parseInt(levelId),
          userId: userId,
          dateTime: new Date(),
          timeTaken: timeTaken,
          languageUsed: language,
        });
      } else {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            correctAnswers: totalCorrectAnswers,
            incorrectAnswers: questions.length - totalCorrectAnswers,
            totalQuestions: questions.length,
            dateTime: new Date(),
            timeTaken: timeTaken,
          });
        });
      }
    } catch (error) {
      console.error("Error saving or updating score:", error);
    }
  };

  const handleRunCode = async () => {
    try {
      const result = await executeCode(language, code);
      const userOutput = result.run.stdout || result.run.stderr;
      setOutput(userOutput);

      if (
        questions.length > 0 &&
        parseInt(localStorage.getItem("level_id")) === 4
      ) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect =
          userOutput.trim() === currentQuestion?.correct_answer?.trim();

        if (isCorrect) {
          setTotalCorrectAnswers((prev) => prev + 1);
          setFeedbackMessage("✅ Your answer is correct!");
        } else {
          setFeedbackMessage("❌ Your answer is incorrect.");
        }

        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          setQuizFinished(true);
        }
      }
    } catch (error) {
      console.error("Error executing code:", error);
      setOutput("Error executing code");
    }
  };

  if (loading) {
    return <Text color="white">Loading questions...</Text>;
  }

  if (error) {
    return <Text color="red.400">{error}</Text>;
  }

  const levelId = parseInt(localStorage.getItem("level_id"));

  return (
    <ChakraProvider theme={theme}>
      <Flex
        direction="column"
        align="center"
        p={6}
        bgGradient="linear(to-r, #2C5364, #203A43, #0F2027)"
        minH="100vh"
      >
        {levelId === 4 && questions.length > 0 ? (
          <Text color="yellow.300" fontSize="2xl" mb={4} fontFamily="Orbitron">
            {`Question: ${questions[currentQuestionIndex]?.question_text}`}
          </Text>
        ) : (
          <Text
            className="practice-message"
            color="yellow.300"
            fontSize="1.8xl"
            mb={2}
            textAlign="center"
            fontWeight="normal"
          >
            **Practice Mode Activated!**
            <br />
            Write, run, and perfect your code right here!
          </Text>
        )}

        <Text color="green.400" fontSize="lg" mb={4} fontFamily="Orbitron">
          {feedbackMessage}
        </Text>

        <Flex
          direction="row"
          w="full"
          maxW="1200px"
          justify="space-between"
          align="center"
          mb={4}
        >
          <Box>
            <Text color="white" mb={1}>
              Language:
            </Text>
            <Select
              color="white"
              bg="#1A202C"
              borderColor="#A6F6FF"
              value={language}
              onChange={(e) => {
                const selectedLanguage = e.target.value;
                setLanguage(selectedLanguage);
                setCode(CODE_SNIPPETS[selectedLanguage] || "");
                setFeedbackMessage("");
              }}
              width="200px"
              _hover={{ borderColor: "#63B3ED" }}
              _focus={{
                borderColor: "#63B3ED",
                boxShadow: "0 0 0 1px #63B3ED",
              }}
              sx={{
                option: {
                  color: "black",
                  bg: "white",
                  _hover: {
                    bg: "#63B3ED",
                    color: "white",
                  },
                  _active: {
                    bg: "#63B3ED",
                    color: "white",
                  },
                },
              }}
            >
              {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Select>
          </Box>
          <Button
            bg="#3182ce"
            color="white"
            _hover={{ bg: "#63B3ED" }}
            onClick={handleRunCode}
          >
            Run Code
          </Button>
        </Flex>

        <Flex w="full" maxW="1200px" gap={4}>
          <Box
            flex={1}
            bg="transparent"
            borderRadius="md"
            border="2px solid #A6F6FF"
            p={4}
            boxShadow="dark-lg"
            height="400px"
          >
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value)}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
              }}
            />
          </Box>

          <Box
            flex={1}
            bg="#2D3748"
            borderRadius="md"
            border="2px solid #A6F6FF"
            p={4}
            boxShadow="dark-lg"
            color="white"
            overflowY="auto"
            height="400px"
          >
            <Text fontSize="xl" mb={4} fontFamily="Orbitron">
              Output:
            </Text>
            <Box as="pre" fontSize="md">
              {output}
            </Box>
          </Box>
        </Flex>

        {quizFinished && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="green.600"
            p={6}
            borderRadius="md"
            boxShadow="dark-lg"
            maxW="600px"
            textAlign="center"
            animation="fadeIn 2s"
          >
            <Text color="white" fontSize="2xl" fontFamily="Orbitron">
              🎉 Quiz Completed!
            </Text>
            <Text color="white" fontSize="lg" fontFamily="Orbitron" mt={2}>
              You answered {totalCorrectAnswers} out of {questions.length}{" "}
              correctly.
            </Text>
            <Button
              mt={4}
              bg="blue.500"
              color="white"
              _hover={{ bg: "blue.400" }}
              onClick={() => window.location.reload()}
            >
              Play Again
            </Button>
          </Box>
        )}
      </Flex>
    </ChakraProvider>
  );
};

export default Compiler;
