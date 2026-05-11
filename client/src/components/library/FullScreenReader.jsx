import React, { useState } from 'react';
import AITutorModal from './AITutorModal';

const FullScreenReader = ({ book, onClose }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col animate-fade-in">
            
            {/* 1. TOP NAVBAR */}
            <div className="bg-white px-4 py-3 flex justify-between items-center shadow-lg z-10">
                {/* Back Button */}
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-bold px-3 py-2 rounded-lg hover:bg-red-50 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Library
                </button>

                {/* Book Title */}
                <div className="hidden md:flex flex-col items-center">
                    <h2 className="font-black text-gray-800 text-lg">{book.title}</h2>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                        {book.subject} • {book.gradeLevel}
                    </span>
                </div>

                {/* 🌟 ASK AI BUTTON 🌟 */}
                <button 
                    onClick={() => setIsChatOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-indigo-200 hover:shadow-lg"
                >
                    <span className="text-xl">🤖</span> 
                    <span>Ask AI for Help</span>
                </button>
            </div>

            {/* 2. PDF VIEWER */}
            <div className="flex-1 w-full bg-gray-600 relative">
                <iframe 
                    src={book.fileUrl} 
                    className="w-full h-full border-none"
                    title={book.title}
                />
            </div>

            {/* 3. AI CHAT OVERLAY */}
            {isChatOpen && (
                <AITutorModal 
                    book={book} 
                    onClose={() => setIsChatOpen(false)} 
                />
            )}
        </div>
    );
};

export default FullScreenReader;