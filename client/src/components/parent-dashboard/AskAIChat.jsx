import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import aiService from "@shared/services/aiService";

const AskAIChat = ({ semesterName, subjects }) => {
  const { i18n } = useTranslation();
  const[messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const[isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    
    // Add user message to UI
    setMessages((prev) => [...prev, { text: userMessage, sender: "parent" }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await aiService.askSemesterQuestion({
        semester: semesterName,
        analytics: subjects,
        question: userMessage,
        language: i18n.language
      });

      // Add AI response to UI
      setMessages((prev) =>[
        ...prev, 
        { text: response.data.answer, sender: "ai" }
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) =>[
        ...prev, 
        { text: "Sorry, I had trouble analyzing that. Please try again.", sender: "system" }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex flex-col h-80 mt-6">
      
      {/* Chat Header */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h4 className="font-bold text-slate-700 text-sm">Ask questions about this report</h4>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-10">
            e.g., "Why did my child's math grade drop?" or "What should we practice this weekend?"
          </p>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "parent" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.sender === "parent" 
                ? "bg-indigo-600 text-white rounded-br-none" 
                : msg.sender === "system"
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default AskAIChat;