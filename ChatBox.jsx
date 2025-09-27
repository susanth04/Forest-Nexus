import React, { useState, useRef, useEffect } from "react";
import "./ChatBox.css"; // Use the new forest-themed CSS

export default function ChatBox({ ocrContext }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! 🌲 I'm your FRA-CSS DSS Assistant. I can help you understand eligible Central Sector Schemes based on your FRA patta information. Ask me about PM-KISAN, MGNREGA, Jal Jeevan Mission, or any other government schemes!"
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const systemPrompt = `You are an expert assistant for the Forest Rights Act (FRA) Decision Support System focusing exclusively on Central Sector Schemes (CSS). 

CONTEXT: FRA OCR Extracted Data:
${ocrContext}

INSTRUCTIONS:
- Only discuss Central Sector Schemes like PM-KISAN, MGNREGA, Jal Jeevan Mission, Ayushman Bharat PM-JAY, PMAY-G, PM-KUSUM, Swachh Bharat Mission, etc.
- Provide specific eligibility criteria, application processes, and benefits
- Reference the user's extracted data when relevant (name, location, land area, etc.)
- Keep responses concise but informative (2-4 sentences)
- Include actionable next steps when possible
- Use a helpful, professional tone

USER QUESTION: ${trimmedInput}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyD6J9Y0DH4Fjx1cBbhhZGj9mcHFb-3hAMI",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 512,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I apologize, but I couldn't generate a proper response. Please try rephrasing your question about Central Sector Schemes.";

      // Add bot response
      setMessages(prev => [...prev, { sender: "bot", text: botReply }]);

    } catch (error) {
      console.error("Chat API Error:", error);
      
      let errorMessage = "I'm having trouble connecting to my knowledge base right now. ";
      
      if (error.message.includes("429")) {
        errorMessage += "Too many requests - please wait a moment and try again.";
      } else if (error.message.includes("403")) {
        errorMessage += "API access issue - please check the configuration.";
      } else {
        errorMessage += "Please try again in a moment. In the meantime, you can explore the scheme links in the left panel.";
      }
      
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: `⚠️ ${errorMessage}`
      }]);
    } finally {
      setIsLoading(false);
      // Refocus input for better UX
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
        <button 
          className="clear-btn" 
          onClick={handleClear}
          title="Clear chat history"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Messages */}
      <div className="messages">
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
        
        <div ref={messagesEndRef} />
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