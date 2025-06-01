import React, { useEffect, useState, useRef } from "react";

const ContentPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState([]);
  const [inputText, setInputText] = useState("");
  const modalRef = useRef(null);
  const messagesEndRef = useRef(null);

  const Spinner = ({ size = 24, color = "text-blue-600" }) => (
    <div className={`inline-flex items-center justify-center ${color}`}>
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99999L16.25 7.82843M4.92157 19.0784L7.75 16.25M4.92157 4.92157L7.75 7.75"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  const fetchApiKey = async () => {
    const result = await chrome.storage.local.get("geminiApiKey");
    if (result && result.geminiApiKey) {
      setApiKey(result.geminiApiKey);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modalOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [message]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClick = () => {
    const url = window.location.href;
    const videoId = new URL(url).searchParams.get("v");

    if (!videoId) {
      setError("❌ Not a valid YouTube video page.");
      return;
    }
    fetchApiKey();
    if (apiKey === "") {
      chrome.runtime.sendMessage({ action: "openPopup" });
      return;
    }

    setModalOpen(true);
    getResponse();
  };

  const getResponse = async () => {
    const url = window.location.href;
    const videoId = new URL(url).searchParams.get("v");

    if (!videoId) {
      alert("❌ Open a video firstly.");
      return;
    }
    setError(null);
  };

  // Clear chat function
  const clearChat = () => {
    setMessage([]);
    setError(null);
  };

  // Function to format AI response with new lines
  const formatResponse = (text) => {
    if (!text) return text;

    // Split on periods followed by space or new lines
    const sentences = text.split(/(?<=\.)\s+/g);

    return sentences.map((sentence, index) => (
      <span key={index}>
        {sentence}
        {index < sentences.length - 1 && (
          <>
            <br />
            <br />
          </>
        )}
      </span>
    ));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const url = window.location.href;
    const videoId = new URL(url).searchParams.get("v");

    if (!videoId) {
      setError("❌ Not a valid YouTube video.");
      return;
    }

    if (!inputText.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const userMessage = { role: "user", text: inputText };
      setMessage((prev) => [...prev, userMessage]);
      setInputText("");

      const response = await fetch(`http://localhost:8000/chat/${videoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText,
          apiKey,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transcript fetch failed.");
      }

      setMessage((prev) => [
        ...prev,
        {
          role: "AI",
          text: data.summary || "No summary available.",
          formattedText: formatResponse(data.summary),
        },
      ]);
    } catch (err) {
      setError(err.message || "❌ Could not fetch response.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 right-6 z-[1100] w-full max-w-xl px-4">
        {modalOpen && apiKey !== "" && (
          <div
            ref={modalRef}
            className="fixed bottom-24 right-6 z-[1100] w-full max-w-xl h-[600px] rounded-xl shadow-xl border border-gray-200 bg-white flex flex-col overflow-hidden transition-all"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
          >
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-800 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <h2 id="chat-title" className="text-xl font-bold select-none">
                  YouTube Chatbot
                </h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearChat}
                  aria-label="Clear chat"
                  className="text-white hover:text-gray-200 text-md  bg-red-500 font-medium py-1 px-3 rounded-md hover:bg-red-600 transition-colors"
                >
                  Clear Chat
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  aria-label="Close chat"
                  className="text-white hover:text-gray-200 text-4xl font-light leading-none p-1  transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Message area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 text-gray-800 text-lg leading-relaxed flex flex-col gap-4">
              {isLoading && message.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner size={32} color="text-blue-600" />
                </div>
              ) : message.length > 0 ? (
                <>
                  {message.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-5 py-3 rounded-2xl max-w-[90%] ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-200 text-gray-800 rounded-tl-none"
                        }`}
                      >
                        <span className="block text-sm font-semibold mb-1">
                          {msg.role === "user" ? "You" : "AI Assistant"}
                        </span>
                        <span className="block whitespace-pre-line">
                          {msg.formattedText || msg.text}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-12 h-12 mb-4 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Ask About This Video
                  </h3>
                  <p className="text-lg">
                    Type your question about the video you're watching and get
                    instant AI-powered answers.
                  </p>
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSendMessage}
              className="flex p-4 border-t border-gray-300 gap-3"
            >
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ask a question..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                Send
              </button>
            </form>

            {/* Error message */}
            {error && (
              <div className="absolute top-0 left-0 w-full p-3 text-center bg-red-500 text-white text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* The main "Chat" button */}
      <div className="fixed bottom-6 right-6 z-[1050]">
        <button
          onClick={handleClick}
          className="flex items-center gap-3 px-6 py-4 bg-white text-black text-xl font-semibold rounded-full shadow-lg hover:bg-gray-200 hover:text-gray-900 transition-all duration-200 transform hover:scale-105"
          aria-label="Open YouTube Video Assistant"
        >
          Ask AI
        </button>
      </div>
    </>
  );
};

export default ContentPage;
