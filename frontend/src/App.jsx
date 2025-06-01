import React, { useState, useEffect } from "react";

const App = () => {
  const [apiKey, setApiKey] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [value, setValue] = useState("");

  const Spinner = ({ size = 20 }) => {
    const computeDelay = (i) => `${-1.2 + i * 0.1}s`;
    const computeRotation = (i) => `${i * 30}deg`;

    return (
      <div
        className="inline-block"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div className="relative left-1/2 top-1/2 h-full w-full">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute left-[-10%] top-[-3.9%] h-[8%] w-[24%] animate-spinner rounded-md bg-current opacity-75"
              style={{
                animationDelay: computeDelay(i),
                transform: `rotate(${computeRotation(i)}) translate(146%)`,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const fetchApiKey = async () => {
    const storedKey = await chrome.storage.local.get("geminiApiKey");
    setApiKey(storedKey.geminiApiKey || "");
    setIsLoaded(true);
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  const removeApiKey = async () => {
    await chrome.storage.local.remove("geminiApiKey");
    setApiKey("");
    setSubmitMessage({
      state: "success",
      message: "API Key removed successfully",
    });
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    try {
      setIsLoading(true);
      chrome.storage.local.set({ geminiApiKey: value });
      setApiKey(value);
      setValue("");
      setSubmitMessage({
        state: "success",
        message: "API Key saved successfully",
      });
    } catch (error) {
      setSubmitMessage({ state: "error", message: error.message });
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="relative p-6 w-[380px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg border border-gray-700 text-white font-sans">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent">
            YouTube Chatbot
          </h1>
        </div>
        <p className="text-sm text-gray-400">
          AI-powered YouTube video chatbot
        </p>
      </div>

      {apiKey && (
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-green-500 mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-gray-300">
                API Key Configured
              </span>
            </div>
            <button
              onClick={removeApiKey}
              className="text-xs px-3 py-1.5 rounded-md bg-red-600/90 hover:bg-red-700 transition text-white flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
              Remove
            </button>
          </div>
        </div>
      )}

      {!apiKey && (
        <form onSubmit={handleSaveApiKey} className="flex flex-col gap-4 w-full">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium text-gray-300">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              disabled={isLoading}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste your API key here"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-800/70 text-white border border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          <p className="text-xs text-gray-400">
            Get your API key from{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline transition"
            >
              Google AI Studio
            </a>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2.5 mt-1 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              isLoading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-md hover:shadow-blue-500/20"
            }`}
          >
            {isLoading ? (
              <>
                <Spinner size={16} />
                Saving...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                />
                </svg>
                Save API Key
              </>
            )}
          </button>
        </form>
      )}

      {submitMessage && (
        <div
          className={`mt-4 text-center text-sm p-3 rounded-lg flex items-center justify-center gap-2 ${
            submitMessage.state === "error"
              ? "bg-red-900/20 text-red-300 border border-red-800"
              : "bg-green-900/20 text-green-300 border border-green-800"
          }`}
        >
          {submitMessage.state === "error" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{submitMessage.message}</span>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        <p>Securely stored in your browser's local storage</p>
      </div>
    </div>
  );
};

export default App;