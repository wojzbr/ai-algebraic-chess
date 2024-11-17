import "./App.css";
import Chessboard from "./Chessboard";
import { Button, Modal, Input, message } from "antd";

import { useState, useEffect } from "react";

const App = () => {
  const [isModalVisible, setIsModalVisible] = useState(
    !window.localStorage.getItem("OPENAI_API_KEY")
  );
  const [apiKey, setApiKey] = useState("");

  const showModal = () => {
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (!window.localStorage.getItem("OPENAI_API_KEY")) {
      showModal();
    }
  }, []);

  const handleOk = () => {
    validateApiKey();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const validateApiKey = async () => {
    try {
      fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }).then((response) => {
        if (response.status === 200) {
          window.localStorage.setItem("OPENAI_API_KEY", apiKey);
          setIsModalVisible(false);
        } else {
          message.error("Invalid API key");
        }
      });
    } catch (error) {
      message.error("Error validating API key");
    }
  };

  return (
    <div className="App">
      <Modal
        title="Chessboard"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="submit" type="primary" onClick={handleOk}>
            Submit
          </Button>,
        ]}
        closable={false}
      >
        <p>
          An OpenAI API client key is needed for this application to work. The
          API keys are stored only locally, in your browser, and the app's
          author does not store or log them. You can generate the API key{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>
        <Input
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={handleApiKeyChange}
        />
      </Modal>
      <Chessboard />
    </div>
  );
};

export default App;
