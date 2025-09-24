import React, { useState } from "react";
import "./ChatBox.css";

export default function ChatBox({ ocrContext }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi 👋 I’m your CSS DSS Assistant. Ask me about eligible schemes or FRA benefits!"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: "user", text: input }]);

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyD6J9Y0DH4Fjx1cBbhhZGj9mcHFb-3hAMI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Context: FRA OCR Extracted Data:\n${ocrContext}\n\nUser question: ${input}\n\nRestrict answers ONLY to Central Sector Schemes (CSS) like PM-KISAN, Jal Jeevan Mission, MGNREGA, DAJGUA, etc., relevant for FRA patta holders and DSS.`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await res.json();
      const botReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn’t fetch a response.";

      setMessages(prev => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ Error connecting to Gemini API." }
      ]);
    }
    setInput("");
  };

  const handleClear = () => {
    setMessages([
      { sender: "bot", text: "Chat cleared. Start fresh 👋" }
    ]);
  };

  return (
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header">
        <h3>💬 CSS DSS Chat Assistant</h3>
        <button className="clear-btn" onClick={handleClear}>
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`msg ${msg.sender}`}>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
