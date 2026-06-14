import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Quiz from "./Quiz";
import quizService from "../../shared/services/quizService";


const QuizCenter = ({ quizzes, quizStatuses }) => {
  const navigate = useNavigate();
  const[showCompleted, setShowCompleted] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);


   useEffect(() => {
    const syncServerTime = async () => {
      try {
        const startReq = Date.now();
        const response = await quizService.getTime();
        const endReq = Date.now();

        // data is from your verified JSON: {"success":true,"serverTime":"..."}
        const serverTime = new Date(response.data.serverTime).getTime();
        
        // Calculate network latency
        const latency = (endReq - startReq) / 2;
        
        // Offset = (Actual Server Time) - (Device Time)
        const offset = (serverTime + latency) - endReq;
        setServerTimeOffset(offset);
      } catch (err) {
        console.error("Time sync failed:", err);
      }
    };
    syncServerTime();
  }, []);

  const pendingQuizzes = quizzes.filter(q => quizStatuses[q._id] && !quizStatuses[q._id].hasTaken);
  const completedQuizzes = quizzes.filter(q => quizStatuses[q._id] && quizStatuses[q._id].hasTaken);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">
          Quiz Center
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Available quizzes and academic activities.
        </p>
      </div>

      {/* PENDING */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-700">
            Pending Quizzes
          </h3>
          <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg text-xs font-black">
            {pendingQuizzes.length}
          </div>
        </div>

        {pendingQuizzes.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 text-center">
            <p className="text-slate-500">
              No pending quizzes available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingQuizzes.map((quiz) => (
                <Quiz
                  key={quiz._id}
                  quiz={quiz}
                  status={quizStatuses[quiz._id]}
                  serverTimeOffset={serverTimeOffset}
                />
              ))}
            </div>
          )}
      </section>

      {/* COMPLETED */}
      {completedQuizzes.length > 0 && (
        <section className="space-y-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="
              w-full
              bg-white
              border
              border-slate-100
              rounded-2xl
              shadow-sm
              px-6
              py-4
              flex
              items-center
              justify-between
              font-black
              text-slate-700
              transition-all
              duration-200
              hover:bg-gray-200
            "
          >
            <span>Completed Quizzes</span>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs">
                {completedQuizzes.length}
              </div>
              <span>{showCompleted ? "▲" : "▼"}</span>
            </div>
          </button>

          {showCompleted && (
            <div className="space-y-3 animate-fadeIn">
              {completedQuizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="
                    bg-white
                    border
                    border-slate-100
                    rounded-2xl
                    shadow-sm
                    px-6
                    py-4
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <h4 className="font-black text-slate-800">
                      {quiz.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {quiz.subject?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/quiz/result/${quiz._id}`)}
                    className="
                      bg-pink-600
                      hover:bg-pink-700
                      text-white
                      px-4
                      py-2
                      rounded-xl
                      text-sm
                      font-bold
                      transition-all
                      duration-200
                    "
                  >
                    View Result
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default React.memo(QuizCenter);