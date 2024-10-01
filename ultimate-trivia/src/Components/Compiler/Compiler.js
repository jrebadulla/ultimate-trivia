import React, { useState } from "react";
import {
  ChakraProvider,
  Button,
  Select,
  Box,
  Flex,
  Text,
  theme,
} from "@chakra-ui/react";
import MonacoEditor from "@monaco-editor/react";
import { executeCode } from "./Api";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "./Constant.js";

const Compiler = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(CODE_SNIPPETS["javascript"]);
  const [output, setOutput] = useState("");

  const handleRunCode = async () => {
    try {
      const result = await executeCode(language, code);
      const userOutput = result.run.stdout || result.run.stderr;
      setOutput(userOutput);
    } catch (error) {
      console.error("Error executing code:", error);
      setOutput("Error executing code");
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" align="center" p={5} bg="#1A202C" minH="100vh">
        <Flex
          direction="row"
          w="full"
          maxW="1200px"
          justify="space-between"
          align="center"
          mb={4}
        >
          <Box>
            <Text color="gray" mb={1}>
              Language:
            </Text>
            <Select
              color="white"
              bg="#2D3748"
              borderColor="#4A5568"
              value={language}
              onChange={(e) => {
                const selectedLanguage = e.target.value;
                setLanguage(selectedLanguage);
                setCode(CODE_SNIPPETS[selectedLanguage] || "");
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
                    bg: "#3182ce",
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
          <Text color="gray" mb={10}>
              Output:
            </Text>
          <Button
            bg="transparent"
            borderColor="#A6F6FF"
            borderWidth="1px"
            right="475px"
            top="15px"
            color="#A6F6FF"
            _hover={{ borderColor: "#A6F6FF" }}
            _active={{ borderColor: "#A6F6FF" }}
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
            borderColor="#A6F6FF"
            borderWidth="1px"
            p={4}
            boxShadow="lg"
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
            bg="transparent"
            borderRadius="md"
            borderColor="#A6F6FF"
            borderWidth="1px"
            p={4}
            boxShadow="lg"
            height="400px"
            overflowY="auto"
          >
            <Box
              bg="#1A202C"
              color="white"
              p={3}
              height="100%"
              overflowY="auto"
            >
              <pre>{output}</pre>
            </Box>
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default Compiler;
