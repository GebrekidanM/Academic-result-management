import React from "react";
import { useNavigate } from "react-router-dom";

const QuizCard = ({
  quiz,
  status
}) => {

  const navigate = useNavigate();

  const handleStartQuiz = () => {
    navigate(`/quiz/${quiz._id}`);
  };

  return (
    <div
      className="
        bg-white
        border
        border-slate-100
        rounded-2xl
        shadow-sm
        p-6
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-md
        hover:border-pink-100
        hover:bg-gray-200
      "
    >

      {/* TOP */}
      <div className="flex items-start justify-between gap-4 mb-5">

        <div>

          <h3 className="text-lg font-black text-slate-800">
            {quiz.title}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {quiz.subject?.name || "Quiz"}
          </p>

        </div>

        <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg text-xs font-black">
          {quiz.questions?.length || 0} Questions
        </div>

      </div>

      {/* BODY */}
      <div className="space-y-3 text-sm text-slate-600">

        <div className="flex items-center justify-between">

          <span>Academic Year</span>

          <span className="font-bold">
            {quiz.academicYear}
          </span>

        </div>

        <div className="flex items-center justify-between">

          <span>Status</span>

          <span
            className={`
              text-xs
              font-black
              px-3
              py-1
              rounded-lg

              ${
                status?.hasTaken
                  ? `
                    bg-green-100
                    text-green-700
                  `
                  : `
                    bg-yellow-100
                    text-yellow-700
                  `
              }
            `}
          >
            {status?.hasTaken
              ? "Completed"
              : "Pending"}
          </span>

        </div>

      </div>

      {/* ACTION */}
      <div className="mt-6">

        <button
          onClick={handleStartQuiz}

          disabled={status?.hasTaken}

          className={`
            w-full
            py-3
            rounded-xl
            font-bold
            transition-all
            duration-200
            active:scale-95

            ${
              status?.hasTaken
                ? `
                  bg-slate-200
                  text-slate-500
                  cursor-not-allowed
                `
                : `
                  bg-pink-600
                  hover:bg-pink-700
                  text-white
                `
            }
          `}
        >

          {status?.hasTaken
            ? "Already Taken"
            : "Start Quiz"}

        </button>

      </div>

    </div>
  );
};

export default React.memo(QuizCard);