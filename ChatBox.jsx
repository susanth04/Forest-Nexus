import React, { useState, useRef, useEffect } from "react";
import "./ChatBox.css";

export default function ChatBox({ ocrContext }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! 🌲 I'm your FRA-CSS DSS Assistant. I can help you understand eligible Central Sector Schemes based on your FRA patta information. Ask me about PM-KISAN, MGNREGA, Jal Jeevan Mission, or any other government schemes!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage = { sender: "user", text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: trimmedInput, ocrContext })
      });

      const data = await response.json();
      const botReply = data.botReply || "⚠️ No response received. Please try again.";
      setMessages(prev => [...prev, { sender: "bot", text: botReply }]);

    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ Can't connect to knowledge base. Try again later." }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      { 
        sender: "bot", 
        text: "Chat cleared! 🔄 Feel free to ask me about any Central Sector Schemes that might benefit FRA patta holders like yourself." 
      }
    ]);
    inputRef.current?.focus();
  };

  const suggestedQuestions = [
    "What schemes am I eligible for based on my FRA patta?",
    "Tell me about PM-KISAN eligibility",
    "How can I apply for MGNREGA work?",
    "What is Jal Jeevan Mission?",
    "Benefits of Ayushman Bharat PM-JAY"
  ];

  const handleSuggestionClick = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header">
        <h3>💬 FRA-CSS Assistant</h3>
        <button className="clear-btn" onClick={handleClear} title="Clear chat history">
          🗑️ Clear
        </button>
      </div>

      {/* Messages */}
      <div className="messages" style={{ overflowY: "auto" }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`msg ${msg.sender}`}>
            <span>{msg.text}</span>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="msg bot">
            <div className="typing-indicator">
              <span>Thinking</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested questions (show when conversation is short) */}
        {messages.length <= 1 && !isLoading && (
          <div className="suggestions">
            <div className="suggestions-header">💡 Try asking:</div>
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                className="suggestion-btn"
                onClick={() => handleSuggestionClick(question)}
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "Generating response..." : "Ask about CSS schemes..."}
          disabled={isLoading}
          maxLength={500}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={isLoading ? "sending" : ""}
          title={isLoading ? "Sending..." : "Send message (Enter)"}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
