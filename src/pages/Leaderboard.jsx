import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaCheckCircle, FaArrowUp, FaCrown, FaLayerGroup } from 'react-icons/fa';

// --- Sub-Component: The Podium Card (Top 3) ---
const PodiumSpot = ({ dept, rank, delay }) => {
  const isFirst = rank === 1;

  // Rank Specific Styles
  const styles = {
    1: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      glow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]',
      iconColor: 'text-yellow-400',
      height: 'h-64 md:h-80',
      scale: 1.05
    },
    2: {
      border: 'border-slate-400/50',
      bg: 'bg-slate-400/10',
      glow: 'shadow-[0_0_30px_rgba(148,163,184,0.2)]',
      iconColor: 'text-slate-300',
      height: 'h-56 md:h-72',
      scale: 1
    },
    3: {
      border: 'border-orange-700/50',
      bg: 'bg-orange-700/10',
      glow: 'shadow-[0_0_30px_rgba(194,65,12,0.2)]',
      iconColor: 'text-orange-400',
      height: 'h-52 md:h-64',
      scale: 0.95
    }
  };

  const style = styles[rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: 'spring' }}
      className={`relative flex flex-col items-center justify-end p-6 rounded-2xl border backdrop-blur-xl ${style.border} ${style.bg} ${style.glow} ${style.height} w-full md:w-1/3 transition-transform hover:scale-[1.02]`}
    >
      {/* Crown for #1 */}
      {isFirst && (
        <div className="absolute -top-8 animate-bounce">
          <FaCrown className="text-yellow-400 text-4xl drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
        </div>
      )}

      {/* Avatar / Icon Placeholder */}
      <div className={`mb-4 p-4 rounded-full border ${style.border} bg-black/30`}>
        <FaTrophy className={`text-3xl ${style.iconColor}`} />
      </div>

      {/* Rank Badge */}
      <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded border ${style.border} ${style.iconColor}`}>
        #{rank}
      </div>

      <div className="text-center z-10">
        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{dept.name}</h3>
        <div className="text-sm text-[var(--muni-text-muted)] font-mono mb-3">{dept.score.toFixed(0)} pts</div>

        {/* Stats Mini Grid */}
        <div className="flex gap-3 text-xs justify-center border-t border-white/10 pt-3">
          <div className="flex items-center gap-1 text-[#046A38]">
            <FaCheckCircle /> {dept.resolvedCount}
          </div>
          <div className="flex items-center gap-1 text-[#06038D]">
            <FaArrowUp /> {dept.upvoteCount}
          </div>
        </div>
      </div>

      {/* Background Gradient Fill */}
      <div className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl pointer-events-none`} />
    </motion.div>
  );
};

// --- Sub-Component: List Row (Rank 4+) ---
const RankRow = ({ dept, rank, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="group flex items-center justify-between p-4 bg-[var(--muni-surface)]/60 border border-white/5 rounded-xl hover:bg-white/5 hover:border-[#FF671F]/30 transition-all mb-3"
  >
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 flex items-center justify-center font-mono font-bold text-[var(--muni-text-muted)] bg-white/5 rounded-lg group-hover:text-[#FF671F] group-hover:bg-[#FF671F]/10 transition-colors">
        {rank}
      </div>
      <div>
        <h4 className="font-bold text-gray-200 group-hover:text-white">{dept.name}</h4>
        <div className="text-xs text-[var(--muni-text-muted)] flex gap-3 md:hidden">
          <span>{dept.resolvedCount} Resolved</span>
          <span>{dept.upvoteCount} Upvotes</span>
        </div>
      </div>
    </div>

    {/* Stats for Desktop */}
    <div className="hidden md:flex items-center gap-8">
      <div className="flex flex-col items-end">
        <span className="text-xs text-[var(--muni-text-muted)] uppercase">Resolved</span>
        <span className="font-mono text-[#046A38]">{dept.resolvedCount}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs text-[var(--muni-text-muted)] uppercase">Upvotes</span>
        <span className="font-mono text-[#06038D]">{dept.upvoteCount}</span>
      </div>
      <div className="flex flex-col items-end w-24">
        <span className="text-xs text-[var(--muni-text-muted)] uppercase">Efficiency</span>
        <div className="w-full bg-gray-700 h-1.5 rounded-full mt-1">
          <div
            className="bg-gradient-to-r from-[#046A38] to-[#06038D] h-full rounded-full"
            style={{ width: `${dept.progressPercentage}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col items-end w-16">
        <span className="text-xs text-[var(--muni-text-muted)] uppercase">Score</span>
        <span className="font-mono font-bold text-yellow-500">{dept.score.toFixed(0)}</span>
      </div>
    </div>
  </motion.div>
);

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const depts = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const deptName = data.department || 'Community Reports';
        const status = data.status;
        const upvotes = data.upvotes || 0;

        if (!depts[deptName]) {
          depts[deptName] = { resolvedCount: 0, upvoteCount: 0, totalIssues: 0 };
        }

        depts[deptName].totalIssues += 1;
        if (status === 'resolved') depts[deptName].resolvedCount += 1;
        depts[deptName].upvoteCount += upvotes;
      });

      const sorted = Object.entries(depts)
        .map(([name, stats]) => ({
          name,
          ...stats,
          progressPercentage: stats.totalIssues > 0 ? (stats.resolvedCount / stats.totalIssues) * 100 : 0,
          score: (stats.resolvedCount * 50) + (stats.upvoteCount * 10) // Simple gamification formula
        }))
        .sort((a, b) => b.score - a.score);

      setLeaderboardData(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[var(--muni-bg)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF671F]"></div>
    </div>
  );

  const topThree = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);

  return (
    <div className="min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans selection:bg-[#FF671F]/30 pb-20">
      <div className="h-20"></div> {/* Navbar Spacer */}

      <main className="max-w-5xl mx-auto px-6 pt-10">

        {/* --- Header --- */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-full bg-[#FF671F]/10 border border-[#FF671F]/30 mb-4"
          >
            <FaMedal className="text-4xl text-[#FF671F]" />
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Department <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]">Rankings</span>
          </h1>
          <p className="text-[var(--muni-text-muted)] text-lg max-w-xl mx-auto">
            Recognizing the most responsive and effective teams in our community.
          </p>
        </div>

        {/* --- Future Data Note --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12 bg-[#FF671F]/5 border border-[#FF671F]/20 rounded-2xl p-6 max-w-3xl mx-auto"
        >
          <p className="text-[var(--muni-text-muted)] text-sm">
            <strong className="text-[#FF671F]">Coming Soon:</strong> We are working on integrating data for <span className="text-white">MLAs, MPs, and Municipality Wards</span> to provide a comprehensive view of civic performance.
          </p>
          <p className="text-[var(--muni-text-muted)] text-xs mt-2">
            Want to help us gather this data or contribute to the development? <a href="mailto:workwithdevit@gmail.com" target="_blank" className="text-[#FF671F] hover:underline">Contact us</a>.
          </p>
        </motion.div>

        {leaderboardData.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl">
            <FaLayerGroup className="mx-auto text-6xl text-gray-800 mb-4" />
            <p className="text-[var(--muni-text-muted)]">No data available for ranking yet.</p>
          </div>
        ) : (
          <>
            {/* --- The Podium (Top 3) --- */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-16 min-h-[340px]">
              {/* Rank 2 */}
              {topThree[1] && <PodiumSpot dept={topThree[1]} rank={2} delay={0.2} />}

              {/* Rank 1 */}
              {topThree[0] && <PodiumSpot dept={topThree[0]} rank={1} delay={0.1} />}

              {/* Rank 3 */}
              {topThree[2] && <PodiumSpot dept={topThree[2]} rank={3} delay={0.3} />}
            </div>

            {/* --- The List (Rank 4+) --- */}
            {restOfList.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-[var(--muni-surface)]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6"
              >
                <h3 className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-4 pl-2">Honorable Mentions</h3>
                <div className="flex flex-col">
                  {restOfList.map((dept, index) => (
                    <RankRow key={dept.name} dept={dept} rank={index + 4} delay={0.1 * index} />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Leaderboard;