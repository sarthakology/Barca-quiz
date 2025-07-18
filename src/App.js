import React, { useState, useEffect, useRef } from "react";
import questionsData from "./questions.json"; // Keep/add your 100 MCQs here

// Fisher-Yates Shuffle
function shuffle(arr) {
  const array = arr.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function FootballQuiz() {
  const [stage, setStage] = useState("form"); // form | quiz | result
  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [timer, setTimer] = useState(60);
  const [quizFinished, setQuizFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB] = useState(true);

  const timerRef = useRef();

  // Fetch leaderboard from backend
  const fetchLeaderboard = async () => {
    setLoadingLB(true);
    try {
      const res = await fetch("https://barca-backend.onrender.com/quiz");
      const data = await res.json();
      setLeaderboard(data || []);
    } catch (e) {
      setLeaderboard([]); // fallback
    }
    setLoadingLB(false);
  };

  // Load leaderboard on mount and when returning to form
  useEffect(() => {
    if (stage === "form") fetchLeaderboard();
  }, [stage]);

  // Timer logic
  useEffect(() => {
    if (stage === "quiz" && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setTimeout(() => finishQuiz(), 500);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [stage, quizFinished]);

  const handleStart = (e) => {
    e.preventDefault();
    if (!user.name.trim() || !user.email.includes("@") || user.phone.length < 8) {
      alert("Fill valid information.");
      return;
    }
    setQuestions(shuffle(questionsData));
    setStage("quiz");
    setCurrent(0);
    setScore(0);
    setAnswer(null);
    setTimer(60);
    setQuizFinished(false);
  };

  const pickOption = (idx) => {
    if (answer !== null) return;
    setAnswer(idx);
    if (idx === questions[current].answer) setScore((s) => s + 1);

    setTimeout(() => {
      if (current + 1 < questions.length && timer > 0) {
        setCurrent((i) => i + 1);
        setAnswer(null);
      } else {
        finishQuiz();
      }
    }, 500);
  };

  // --- MAIN: Submits to backend, then fetches the new leaderboard
  const finishQuiz = async () => {
    setQuizFinished(true);
    try {
      await fetch("https://barca-backend.onrender.com/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          score
        })
      });
      // Re-fetch leaderboard with your latest result included
      await fetchLeaderboard();
    } catch (e) {}
    setStage("result");
  };

  function timeColor() {
    if (timer <= 10) return "text-red-600";
    if (timer <= 30) return "text-yellow-600";
    return "text-blue-800";
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-900 flex items-center justify-center px-2">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 md:p-10 relative">
        {/* Barça Banner */}
        <div className="flex flex-col items-center mb-1">
          <img
            alt="barca"
            src="https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png"
            className="w-16 h-16 mb-1"
          />
          <h1 className="text-2xl font-bold text-blue-900 mb-1">Barça Football Quiz</h1>
        </div>

        {/* --- FORM/LEADERBOARD/INFO --- */}
        {stage === "form" && (
          <div className="flex flex-col gap-4">
            {/* Leaderboard */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-blue-800">🏆 Leaderboard</h2>
              {loadingLB ? (
                <div className="text-sm text-gray-400 p-4 text-center">Loading...</div>
              ) : (
                <ul className="bg-gray-50 rounded-xl p-3 text-sm">
                  {leaderboard.length === 0 ? (
                    <li className="text-gray-400 italic">No scores yet.</li>
                  ) : leaderboard.slice(0, 5).map((item, i) => (
                    <li
                      key={item._id || item.name + i}
                      className="flex justify-between items-center py-1 border-b last:border-0"
                    >
                      <span className="font-bold text-blue-700">
                        {i + 1}. {item.name}
                      </span>
                      <span className="text-green-700 font-semibold">
                        {item.score} pts
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Reward Info */}
            <div className="mb-4">
              <h2 className="font-semibold text-blue-800">🎁 Special Prize</h2>
              <ul className="text-[15px] list-disc pl-5 text-gray-600">
                <li>
                  <strong>Score 18 or more</strong> to get a{" "}
                  <span className="font-semibold text-blue-700">
                    10% off coupon for Barça Camps
                  </span>
                  !
                </li>
              </ul>
            </div>
            {/* User Info Form */}
            <form className="flex flex-col gap-3" onSubmit={handleStart}>
              <input
                className="border px-3 py-2 rounded text-lg outline-blue-700"
                placeholder="Name"
                value={user.name}
                onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
              />
              <input
                className="border px-3 py-2 rounded text-lg outline-blue-700"
                placeholder="Email"
                type="email"
                value={user.email}
                onChange={e => setUser(u => ({ ...u, email: e.target.value }))}
              />
              <input
                className="border px-3 py-2 rounded text-lg outline-blue-700"
                placeholder="Phone"
                type="tel"
                value={user.phone}
                onChange={e => setUser(u => ({ ...u, phone: e.target.value }))}
              />
              <button
                className="mt-2 bg-blue-800 text-white text-lg font-bold py-2 rounded-md hover:bg-blue-900"
                type="submit"
              >
                Start Quiz
              </button>
            </form>
          </div>
        )}

        {/* --- QUIZ TIMER --- */}
        {stage === "quiz" && (
          <div className="mb-5 flex justify-center items-center">
            <div className={`text-2xl font-bold ${timeColor()}`}>⏰ {timer}s</div>
          </div>
        )}

        {/* --- QUIZ BODY --- */}
        {stage === "quiz" && current < questions.length && timer > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1 mt-2">
              <div className="text-blue-700 font-semibold">
                Q {current + 1} / {questions.length}
              </div>
              <div className="text-green-700 font-bold">
                Score: {score}
              </div>
            </div>
            <div className="my-3 py-2 text-lg font-semibold text-gray-800 min-h-[64px]">
              {questions[current]?.question}
            </div>
            <div className="flex flex-col gap-3">
              {questions[current]?.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={
                    "text-md rounded-lg border px-3 py-2 transition font-medium text-left" +
                    (answer === null
                      ? " hover:bg-blue-50"
                      : idx === questions[current].answer
                      ? " bg-green-200 border-green-600"
                      : answer === idx
                      ? " bg-red-200 border-red-600"
                      : " bg-gray-100"
                    )
                  }
                  onClick={() => pickOption(idx)}
                  disabled={answer !== null}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- RESULT PAGE --- */}
        {stage === "result" && (
          <div className="text-center mt-5 flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold text-green-900 mb-1">
              Quiz Finished!
            </h2>
            <p className="text-lg text-blue-800">Thanks for playing, {user.name}!</p>
            <div className="text-2xl font-bold text-yellow-500">
              Your Score: {score} / {questions.length}
            </div>

            {/* Show prize message if user scored 18+ */}
            {score >= 18 && (
              <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                <span className="text-green-700 text-lg font-semibold">
                  🎉 Congratulations! You will receive a <span className="font-bold text-blue-800">10% off coupon</span> in your email!
                </span>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-blue-800 mt-2 mb-1">🏆 Leaderboard</h3>
              {loadingLB ? (
                <div className="text-sm text-gray-400 p-4 text-center">Loading...</div>
              ) : (
                <ul className="bg-gray-50 rounded-xl p-3 text-sm mb-2">
                  {leaderboard.length === 0 ? (
                    <li className="text-gray-400 italic">No scores yet.</li>
                  ) : leaderboard.slice(0, 5).map((item, i) => (
                    <li
                      key={item._id || item.name + i}
                      className={`flex justify-between items-center py-1 border-b last:border-0
                        ${item.name === user.name && item.score === score ? "bg-blue-100 font-extrabold" : ""}
                      `}
                    >
                      <span className="font-bold text-blue-700">{i + 1}. {item.name}</span>
                      <span className="text-green-700 font-semibold">{item.score} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="bg-purple-800 text-white font-bold rounded-2xl py-2 px-7 hover:bg-purple-900"
              onClick={() => setStage("form")}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
