import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import aiService from '../../services/aiService';

const AITutorModal = ({ book, onClose }) => {
    const { i18n } = useTranslation();
    const [messages, setMessages] = useState([
        { text: `Hi! I'm your AI Tutor. What would you like to know about "${book.title}"?`, sender: "ai" }
    ]);
    const [input, setInput] = useState('');
    const[isTyping, setIsTyping] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { text: userMessage, sender: "student" }]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await aiService.askBookQuestion({
                title: book.title,
                subject: book.subject,
                gradeLevel: book.gradeLevel,
                question: userMessage,
                language: i18n.language
            });

            setMessages(prev => [...prev, { text: response.data.answer, sender: "ai" }]);
        } catch (error) {
            setMessages(prev =>[...prev, { text: "Oops! My brain froze. Try asking again! 🧠❄️", sender: "ai" }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
                
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">🤖 AI Study Tutor</h3>
                        <p className="text-blue-100 text-xs mt-1">Discussing: {book.title}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-red-200 text-2xl leading-none">&times;</button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === "student" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                msg.sender === "student" 
                                    ? "bg-blue-600 text-white rounded-br-none shadow-md" 
                                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        disabled={isTyping}
                    />
                    <button type="submit" disabled={!input.trim() || isTyping} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AITutorModal;