import React, { useState, useEffect } from 'react';
import {db} from "./firebase";
import {collection, addDoc, getDocs } from "firebase/firestore";
// ─── Data ─────────────────────────────────────────────────────────────────────
const ADMIN_CREDS = { username: 'admin', password: 'admin123' };

const questions = [
  {
    id: 1,
    category: 'Quantitative',
    question:
      'A train 150m long passes a pole in 15 seconds. How long will it take to pass a platform 300m long?',
    options: ['30 seconds', '45 seconds', '35 seconds', '40 seconds'],
    answer: 1,
    explanation:
      'Speed = 150/15 = 10 m/s. Distance = 150+300 = 450m. Time = 450/10 = 45s.',
  },
  {
    id: 2,
    category: 'Logical Reasoning',
    question: 'If PENCIL is coded as QFODLM, how is ERASER coded?',
    options: ['FSBTFS', 'FSBSFS', 'FSBSFQ', 'FSBSFR'],
    answer: 0,
    explanation:
      'Each letter is shifted +1 in the alphabet: E→F, R→S, A→B, S→T, E→F, R→S = FSBTFS.',
  },
  {
    id: 3,
    category: 'Data Interpretation',
    question:
      "A company's revenue grew from ₹40 lakhs to ₹52 lakhs. What is the percentage increase?",
    options: ['25%', '28%', '30%', '32%'],
    answer: 2,
    explanation: 'Increase = 12 lakhs. % = (12/40) × 100 = 30%.',
  },
  {
    id: 4,
    category: 'Verbal Ability',
    question: "Choose the word most OPPOSITE in meaning to 'OSTENTATIOUS':",
    options: ['Flamboyant', 'Modest', 'Pompous', 'Lavish'],
    answer: 1,
    explanation:
      "Ostentatious means showy/pretentious. Its antonym is 'Modest' (unassuming, humble).",
  },
  {
    id: 5,
    category: 'Quantitative',
    question:
      'If 6 workers complete a job in 8 days, how many days will 4 workers take to complete the same job?',
    options: ['10 days', '12 days', '14 days', '16 days'],
    answer: 1,
    explanation:
      'Work = 6×8 = 48 man-days. Days for 4 workers = 48/4 = 12 days.',
  },
  {
    id: 6,
    category: 'Critical Thinking',
    question:
      'All managers are leaders. Some leaders are visionaries. Which conclusion is definitely true?',
    options: [
      'All managers are visionaries',
      'Some managers are visionaries',
      'No manager is a visionary',
      'Some managers may or may not be visionaries',
    ],
    answer: 3,
    explanation:
      "Since only 'some leaders' are visionaries, we cannot confirm managers are visionaries — only that it's possible.",
  },
  {
    id: 7,
    category: 'Engineering Aptitude',
    question:
      'A gear with 20 teeth meshes with a gear of 60 teeth. If the smaller gear rotates at 300 RPM, what is the RPM of the larger gear?',
    options: ['900 RPM', '100 RPM', '200 RPM', '150 RPM'],
    answer: 1,
    explanation:
      'Gear ratio = 20/60 = 1/3. RPM of larger gear = 300 × (1/3) = 100 RPM.',
  },
  {
    id: 8,
    category: 'Management',
    question:
      'Which leadership style involves employees in decision-making and encourages autonomy?',
    options: ['Autocratic', 'Laissez-faire', 'Democratic', 'Transactional'],
    answer: 2,
    explanation:
      'Democratic (participative) leadership involves team members in decision-making while the leader retains final authority.',
  },
  {
    id: 9,
    category: 'Quantitative',
    question: 'Simple interest on ₹5000 at 8% per annum for 3 years is:',
    options: ['₹1000', '₹1200', '₹1500', '₹2000'],
    answer: 1,
    explanation: 'SI = (P × R × T)/100 = (5000 × 8 × 3)/100 = ₹1200.',
  },
  {
    id: 10,
    category: 'Analytical',
    question: 'A series: 2, 6, 12, 20, 30, ___ . What comes next?',
    options: ['40', '42', '44', '46'],
    answer: 1,
    explanation:
      'Differences: 4,6,8,10,12. Pattern = n(n+1). Next term = 30+12 = 42.',
  },
];

const categoryColors = {
  Quantitative: { badge: '#FFEDD5', text: '#9A3412' },
  'Logical Reasoning': { badge: '#DBEAFE', text: '#1E40AF' },
  'Data Interpretation': { badge: '#DCFCE7', text: '#166534' },
  'Verbal Ability': { badge: '#F3E8FF', text: '#6B21A8' },
  'Critical Thinking': { badge: '#FFE4E6', text: '#9F1239' },
  'Engineering Aptitude': { badge: '#E0F2FE', text: '#075985' },
  Management: { badge: '#FEF9C3', text: '#854D0E' },
  Analytical: { badge: '#E2E8F0', text: '#1E293B' },
};

const TOTAL_TIME = 600;
function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(
    s % 60
  ).padStart(2, '0')}`;
}

// ─── Storage using LocalStorage ─────────────────────────────────────────────
const PREFIX = 'aptresult:';

async function saveResult(entry) {
  try {
    await addDoc(collection(db, "quizResults"), entry);
    console.log("Result saved to Firestore");
  } catch (error) {
    console.error("Error saving result:", error);
  }
}

function loadAllResults() {
  const results = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key.startsWith(PREFIX)) {
        const value = localStorage.getItem(key);
        results.push(JSON.parse(value));
      }
    }
  } catch (e) {
    console.error('loadAllResults failed:', e);
  }

  return results;
}

// ─── Shared base CSS ──────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .fade-up  { animation: fadeUp 0.5s ease both; }
  .fade-up2 { animation: fadeUp 0.5s 0.08s ease both; }
  .fade-up3 { animation: fadeUp 0.5s 0.16s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .slide-in { animation: slideIn 0.28s ease both; }
  @keyframes slideIn { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
  .btn { transition: all 0.17s ease; cursor: pointer; font-family: 'Source Serif 4', serif; }
  .btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  .opt { transition: all 0.13s ease; cursor: pointer; border: none; text-align: left; font-family: 'Source Serif 4', serif; }
  .opt:hover:not(:disabled) { transform: translateX(5px); }
  .pulse { animation: pulse 1s ease infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  input { outline: none; font-family: 'Source Serif 4', serif; }
  select { font-family: 'Source Serif 4', serif; appearance: none; cursor: pointer; }
`;

const dark = '#0A0F1E';
const card = '#111827';
const line = '#1F2937';
const muted = '#4B5563';
const soft = '#6B7280';
const dim = '#9CA3AF';
const light = '#E5E7EB';
const white = '#F9FAFB';
const amber = '#D97706';
const amberL = '#F59E0B';

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function submit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      if (tab === 'admin') {
        if (
          username.trim() === ADMIN_CREDS.username &&
          password === ADMIN_CREDS.password
        ) {
          onLogin({ username: username.trim(), role: 'admin' });
        } else {
          setError('Invalid admin credentials.');
          setBusy(false);
        }
      } else {
        onLogin({ username: username.trim(), role: 'user' });
      }
    }, 500);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Source Serif 4',serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>
        {BASE_CSS}
        {`
        .tab { transition: all 0.18s; cursor:pointer; border:none; background:none; font-family:'Source Serif 4',serif; }
        .inp { transition: border-color 0.18s, box-shadow 0.18s; }
        .inp:focus { border-color: ${amberL} !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.13); }
        .glow { position:absolute; border-radius:50%; filter:blur(90px); pointer-events:none; }
      `}
      </style>
      <div
        className="glow"
        style={{
          width: 360,
          height: 360,
          background: 'rgba(245,158,11,0.06)',
          top: -100,
          right: -80,
        }}
      />
      <div
        className="glow"
        style={{
          width: 260,
          height: 260,
          background: 'rgba(99,102,241,0.05)',
          bottom: -80,
          left: -60,
        }}
      />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: card,
              border: `1px solid ${line}`,
              borderRadius: 12,
              padding: '9px 20px',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                color: amberL,
                fontWeight: 900,
                fontSize: 20,
              }}
            >
              APT
            </span>
            <span style={{ color: '#374151', fontSize: 16 }}>|</span>
            <span
              style={{
                color: soft,
                fontSize: 12,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Examination Portal
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              color: white,
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: soft, fontSize: 14, marginTop: 6 }}>
            Sign in to access the aptitude test
          </p>
        </div>

        <div
          style={{
            background: card,
            border: `1px solid ${line}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${line}` }}>
            {[
              ['user', '👤 User'],
              ['admin', '🔐 Admin'],
            ].map(([t, label]) => (
              <button
                key={t}
                className="tab"
                onClick={() => {
                  setTab(t);
                  setError('');
                  setUsername('');
                  setPassword('');
                }}
                style={{
                  flex: 1,
                  padding: '13px',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: tab === t ? amberL : muted,
                  borderBottom: `2px solid ${
                    tab === t ? amberL : 'transparent'
                  }`,
                  background:
                    tab === t ? 'rgba(245,158,11,0.04)' : 'transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ padding: 28 }}>
            {[
              [
                'Username',
                username,
                setUsername,
                'text',
                tab === 'admin' ? 'admin' : 'Your name',
              ],
              [
                'Password',
                password,
                setPassword,
                'password',
                tab === 'admin' ? '••••••••' : 'Create a password',
              ],
            ].map(([lbl, val, set, type, ph]) => (
              <div key={lbl} style={{ marginBottom: 16 }}>
                <label
                  style={{
                    color: dim,
                    fontSize: 11,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 7,
                  }}
                >
                  {lbl}
                </label>
                <input
                  className="inp"
                  type={type}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  style={{
                    width: '100%',
                    background: dark,
                    border: `1.5px solid ${line}`,
                    borderRadius: 10,
                    padding: '11px 14px',
                    color: white,
                    fontSize: 15,
                  }}
                />
              </div>
            ))}

            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#FCA5A5',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={busy}
              style={{
                width: '100%',
                background: busy ? '#374151' : amber,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px',
                fontSize: 15,
                fontWeight: 700,
                boxShadow: busy ? 'none' : '0 4px 16px rgba(217,119,6,0.3)',
              }}
            >
              {busy
                ? 'Signing in…'
                : tab === 'admin'
                ? 'Admin Login →'
                : 'Start Exam →'}
            </button>

            {tab === 'admin' && (
              <p
                style={{
                  color: '#374151',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Demo credentials: admin / admin123
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ admin, onLogout }) {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [errMsg, setErrMsg] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filter, setFilter] = useState('all');

  async function fetchResults() {
    setStatus("loading");
    try {
      const querySnapshot = await getDocs(collection(db, "quizResults"));
  
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });
  
      setResults(data);
      setStatus("ok");
    } catch (e) {
      setErrMsg(String(e));
      setStatus("error");
    }
  }

  useEffect(() => {
    fetchResults();
  }, []);

  function gradeColor(pct) {
    return pct >= 80
      ? '#22C55E'
      : pct >= 60
      ? '#F59E0B'
      : pct >= 40
      ? '#F97316'
      : '#EF4444';
  }
  function grade(pct) {
    return pct >= 80
      ? 'Excellent'
      : pct >= 60
      ? 'Good'
      : pct >= 40
      ? 'Average'
      : 'Poor';
  }

  const filtered = results
    .filter((r) =>
      filter === 'all' ? true : filter === 'pass' ? r.pct >= 60 : r.pct < 60
    )
    .sort((a, b) =>
      sortBy === 'score'
        ? b.score - a.score
        : sortBy === 'time'
        ? b.timeLeft - a.timeLeft
        : a.username.localeCompare(b.username)
    );

  const avg = results.length
    ? Math.round(results.reduce((a, r) => a + r.pct, 0) / results.length)
    : 0;
  const topScore = results.length
    ? Math.max(...results.map((r) => r.score))
    : 0;
  const passRate = results.length
    ? Math.round(
        (results.filter((r) => r.pct >= 60).length / results.length) * 100
      )
    : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: dark,
        fontFamily: "'Source Serif 4',serif",
        padding: '20px 16px',
      }}
    >
      <style>
        {BASE_CSS}
        {`
        .scard { transition: transform 0.18s; } .scard:hover { transform: translateY(-3px); }
        .rrow  { transition: background 0.13s; } .rrow:hover  { background: rgba(245,158,11,0.04) !important; }
      `}
      </style>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Header */}
        <div
          className="fade-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  color: amberL,
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                APT
              </span>
              <span style={{ color: '#374151' }}>|</span>
              <span
                style={{
                  color: soft,
                  fontSize: 11,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                Admin Dashboard
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                color: white,
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              Candidate Results
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={fetchResults}
              className="btn"
              style={{
                background: card,
                color: dim,
                border: `1px solid ${line}`,
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13,
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={onLogout}
              className="btn"
              style={{
                background: 'rgba(239,68,68,0.09)',
                color: '#FCA5A5',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13,
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="fade-up2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 12,
            marginBottom: 22,
          }}
        >
          {[
            {
              label: 'Total Candidates',
              value: results.length,
              icon: '👥',
              color: '#60A5FA',
            },
            {
              label: 'Average Score',
              value: `${avg}%`,
              icon: '📊',
              color: amberL,
            },
            {
              label: 'Top Score',
              value: `${topScore}/10`,
              icon: '🏆',
              color: '#22C55E',
            },
            {
              label: 'Pass Rate (≥60%)',
              value: `${passRate}%`,
              icon: '✅',
              color: '#A78BFA',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="scard"
              style={{
                background: card,
                border: `1px solid ${line}`,
                borderRadius: 12,
                padding: '17px 18px',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 7 }}>{s.icon}</div>
              <div
                style={{
                  color: s.color,
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                {s.value}
              </div>
              <div style={{ color: muted, fontSize: 11, marginTop: 3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter / sort controls */}
        <div
          className="fade-up3"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: soft, fontSize: 13, flex: 1 }}>
            {status === 'loading'
              ? 'Loading…'
              : `${filtered.length} candidate${
                  filtered.length !== 1 ? 's' : ''
                }`}
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: card,
              color: light,
              border: `1px solid ${line}`,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
            }}
          >
            <option value="all">All Candidates</option>
            <option value="pass">Passed Only</option>
            <option value="fail">Failed Only</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: card,
              color: light,
              border: `1px solid ${line}`,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
            }}
          >
            <option value="score">Sort: Score</option>
            <option value="name">Sort: Name</option>
            <option value="time">Sort: Time Left</option>
          </select>
        </div>

        {/* Table */}
        <div
          style={{
            background: card,
            border: `1px solid ${line}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* Col headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 76px 70px 96px 96px 100px',
              gap: 0,
              padding: '11px 18px',
              borderBottom: `1px solid ${line}`,
            }}
          >
            {[
              '#',
              'Candidate',
              'Score',
              'Pct',
              'Grade',
              'Time Left',
              'Status',
            ].map((h) => (
              <div
                key={h}
                style={{
                  color: muted,
                  fontSize: 10,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* States */}
          {status === 'loading' && (
            <div style={{ padding: '52px', textAlign: 'center', color: muted }}>
              <div className="pulse" style={{ fontSize: 28, marginBottom: 10 }}>
                ⏳
              </div>
              Loading results…
            </div>
          )}
          {status === 'error' && (
            <div style={{ padding: '36px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ color: '#FCA5A5', fontSize: 14, marginBottom: 6 }}>
                Failed to load results
              </div>
              <div style={{ color: muted, fontSize: 12, marginBottom: 16 }}>
                {errMsg}
              </div>
              <button
                onClick={fetchResults}
                className="btn"
                style={{
                  background: amber,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Retry
              </button>
            </div>
          )}
          {status === 'ok' && filtered.length === 0 && (
            <div style={{ padding: '52px', textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>📭</div>
              <div style={{ color: muted, fontSize: 15 }}>
                {results.length === 0
                  ? 'No candidates have taken the test yet.'
                  : 'No results match this filter.'}
              </div>
            </div>
          )}
          {status === 'ok' &&
            filtered.map((r, i) => (
              <div
                key={r.username}
                className="rrow"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 76px 70px 96px 96px 100px',
                  gap: 0,
                  padding: '13px 18px',
                  borderBottom:
                    i < filtered.length - 1 ? `1px solid #161F2E` : 'none',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ color: light, fontSize: 14, fontWeight: 600 }}>
                    {r.username}
                  </div>
                  <div style={{ color: '#374151', fontSize: 11, marginTop: 2 }}>
                    {new Date(r.timestamp).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    color: white,
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {r.score}/10
                </div>
                <div
                  style={{
                    color: gradeColor(r.pct),
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {r.pct}%
                </div>
                <div
                  style={{
                    color: gradeColor(r.pct),
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {grade(r.pct)}
                </div>
                <div style={{ color: '#60A5FA', fontSize: 13 }}>
                  {formatTime(r.timeLeft)}
                </div>
                <div>
                  <span
                    style={{
                      background:
                        r.pct >= 60
                          ? 'rgba(34,197,94,0.1)'
                          : 'rgba(239,68,68,0.1)',
                      color: r.pct >= 60 ? '#4ADE80' : '#FCA5A5',
                      border: `1px solid ${
                        r.pct >= 60
                          ? 'rgba(34,197,94,0.25)'
                          : 'rgba(239,68,68,0.25)'
                      }`,
                      borderRadius: 20,
                      padding: '3px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {r.pct >= 60 ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
        </div>
        <div
          style={{
            marginTop: 10,
            color: '#374151',
            fontSize: 11,
            textAlign: 'right',
          }}
        >
          Results are shared across all sessions.
        </div>
      </div>
    </div>
  );
}

// ─── IntroScreen ──────────────────────────────────────────────────────────────
function IntroScreen({ user, onStart, onLogout }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Source Serif 4',serif",
      }}
    >
      <style>{BASE_CSS}</style>
      <div
        className="fade-up"
        style={{
          background: card,
          border: `1px solid ${line}`,
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          padding: 40,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 26,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: amber,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
              }}
            >
              📋
            </div>
            <span
              style={{
                color: soft,
                fontSize: 11,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Aptitude Test
            </span>
          </div>
          <button
            onClick={onLogout}
            className="btn"
            style={{
              background: 'transparent',
              color: muted,
              border: `1px solid ${line}`,
              borderRadius: 7,
              padding: '6px 12px',
              fontSize: 12,
            }}
          >
            Sign Out
          </button>
        </div>
        <div style={{ color: amberL, fontSize: 13, marginBottom: 6 }}>
          Hello, {user.username} 👋
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display',serif",
            color: white,
            fontSize: 'clamp(24px,5vw,34px)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 14,
          }}
        >
          Aptitude
          <br />
          Assessment Test
        </h1>
        <p
          style={{
            color: soft,
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 26,
          }}
        >
          A comprehensive test across Quantitative, Logical, Verbal, and more.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 30,
          }}
        >
          {[
            ['10 Questions', '8 categories'],
            ['10 Minutes', 'Timed exam'],
            ['MCQ Format', 'Single best answer'],
            ['Full Review', 'Post-submission only'],
          ].map(([h, s]) => (
            <div
              key={h}
              style={{
                background: dark,
                borderRadius: 10,
                padding: '12px 14px',
                border: `1px solid ${line}`,
              }}
            >
              <div style={{ color: amberL, fontWeight: 700, fontSize: 13 }}>
                {h}
              </div>
              <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>
                {s}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onStart}
          className="btn"
          style={{
            width: '100%',
            background: amber,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: 14,
            fontSize: 15,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(217,119,6,0.3)',
          }}
        >
          Begin Examination →
        </button>
      </div>
    </div>
  );
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────
function QuizScreen({ user, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [flagged, setFlagged] = useState(Array(questions.length).fill(false));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      doSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  async function doSubmit() {
    if (saving) return;
    setSaving(true);
    const score = questions.reduce(
      (a, q, i) => a + (selected[i] === q.answer ? 1 : 0),
      0
    );
    const entry = {
      username: user.username,
      score,
      pct: Math.round((score / questions.length) * 100),
      timeLeft,
      timestamp: Date.now(),
      answers: selected,
    };
    await saveResult(entry);
    onFinish({ score, timeLeft, selected });
  }

  const q = questions[current];
  const colors = categoryColors[q.category] || categoryColors['Analytical'];
  const answered = selected.filter((s) => s !== null).length;
  const urgent = timeLeft <= 60;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: dark,
        fontFamily: "'Source Serif 4',serif",
        padding: 16,
      }}
    >
      <style>{BASE_CSS}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                color: amberL,
                fontWeight: 900,
                fontSize: 17,
              }}
            >
              APT
            </span>
            <span style={{ color: '#1F2937' }}>|</span>
            <span style={{ color: muted, fontSize: 13 }}>{user.username}</span>
            <span style={{ color: '#1F2937' }}>·</span>
            <span style={{ color: muted, fontSize: 13 }}>
              {answered}/{questions.length} answered
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: urgent ? 'rgba(239,68,68,0.1)' : card,
              border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : line}`,
              borderRadius: 8,
              padding: '7px 13px',
            }}
          >
            <span className={urgent ? 'pulse' : ''} style={{ fontSize: 13 }}>
              ⏱
            </span>
            <span
              style={{
                color: urgent ? '#EF4444' : dim,
                fontWeight: 700,
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: line,
            borderRadius: 2,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((current + 1) / questions.length) * 100}%`,
              background: amberL,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Question card */}
        <div
          className="slide-in"
          key={current}
          style={{
            background: card,
            borderRadius: 13,
            padding: 26,
            border: `1px solid ${line}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                background: colors.badge,
                color: colors.text,
                padding: '3px 11px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {q.category}
            </span>
            <span style={{ color: '#374151', fontSize: 12 }}>
              Q{q.id} / {questions.length}
            </span>
            {flagged[current] && (
              <span style={{ color: amberL, fontSize: 12 }}>🚩 Flagged</span>
            )}
          </div>
          <p
            style={{
              color: light,
              fontSize: 'clamp(14px,2.3vw,17px)',
              lineHeight: 1.7,
              marginBottom: 22,
            }}
          >
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {q.options.map((opt, idx) => {
              const isSel = selected[current] === idx;
              return (
                <button
                  key={idx}
                  className="opt"
                  onClick={() => {
                    const n = [...selected];
                    n[current] = idx;
                    setSelected(n);
                  }}
                  style={{
                    background: isSel ? 'rgba(245,158,11,0.08)' : dark,
                    border: `1.5px solid ${isSel ? amberL : line}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: isSel ? '#FDE68A' : soft,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      color: '#374151',
                      fontSize: 11,
                      minWidth: 18,
                      fontWeight: 700,
                    }}
                  >
                    {['A', 'B', 'C', 'D'][idx]}.
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isSel && (
                    <span style={{ color: amberL, fontSize: 12 }}>●</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            style={{
              background: card,
              color: current === 0 ? line : soft,
              border: `1px solid ${line}`,
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 14,
              cursor: current === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <button
            className="btn"
            onClick={() => {
              const n = [...flagged];
              n[current] = !n[current];
              setFlagged(n);
            }}
            style={{
              background: flagged[current] ? 'rgba(245,158,11,0.1)' : card,
              color: flagged[current] ? amberL : muted,
              border: `1px solid ${flagged[current] ? amberL : line}`,
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
            }}
          >
            {flagged[current] ? '🚩' : '⚑'}
          </button>
          <div style={{ flex: 1 }} />
          {current < questions.length - 1 ? (
            <button
              className="btn"
              onClick={() => setCurrent((c) => c + 1)}
              style={{
                background: card,
                color: soft,
                border: `1px solid ${line}`,
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 14,
              }}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn"
              onClick={doSubmit}
              disabled={saving}
              style={{
                background: saving ? '#374151' : amber,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 22px',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: saving ? 'none' : '0 4px 14px rgba(217,119,6,0.3)',
              }}
            >
              {saving ? 'Submitting…' : 'Submit Test →'}
            </button>
          )}
        </div>

        {/* Question navigator */}
        <div
          style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          {questions.map((_, i) => {
            const isCurr = i === current,
              isDone = selected[i] !== null,
              isFlag = flagged[i];
            let bg = card,
              border = line,
              color = muted;
            if (isCurr) {
              bg = amberL;
              border = amberL;
              color = '#000';
            } else if (isFlag) {
              bg = 'rgba(245,158,11,0.1)';
              border = amberL;
              color = amberL;
            } else if (isDone) {
              bg = '#1F2937';
              border = '#374151';
              color: light;
            }
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: 33,
                  height: 33,
                  borderRadius: 7,
                  background: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  fontFamily: "'Source Serif 4',serif",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────
function ResultScreen({ user, result, onReview, onLogout }) {
  const { score, timeLeft, selected } = result;
  const pct = Math.round((score / questions.length) * 100);
  const grade =
    pct >= 80
      ? 'Excellent'
      : pct >= 60
      ? 'Good'
      : pct >= 40
      ? 'Average'
      : 'Needs Work';
  const gc =
    pct >= 80
      ? '#22C55E'
      : pct >= 60
      ? '#F59E0B'
      : pct >= 40
      ? '#F97316'
      : '#EF4444';
  const wrong =
    questions.length - score - selected.filter((s) => s === null).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Source Serif 4',serif",
      }}
    >
      <style>{BASE_CSS}</style>
      <div
        className="fade-up"
        style={{
          maxWidth: 560,
          width: '100%',
          background: card,
          borderRadius: 16,
          padding: 34,
          border: `1px solid ${line}`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>
            {pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : pct >= 40 ? '📚' : '💪'}
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              color: white,
              fontSize: 26,
              fontWeight: 900,
              marginBottom: 4,
            }}
          >
            Test Complete
          </h2>
          <p style={{ color: soft, fontSize: 14 }}>
            Well done, {user.username}!
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 9,
            marginBottom: 22,
          }}
        >
          {[
            { l: 'Score', v: `${score}/10`, c: gc },
            { l: 'Percentage', v: `${pct}%`, c: gc },
            { l: 'Grade', v: grade, c: gc },
            { l: 'Time Left', v: formatTime(timeLeft), c: '#60A5FA' },
            { l: 'Correct', v: score, c: '#22C55E' },
            { l: 'Wrong', v: wrong, c: '#EF4444' },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: dark,
                borderRadius: 10,
                padding: '13px',
                textAlign: 'center',
                border: `1px solid ${line}`,
              }}
            >
              <div
                style={{
                  color: s.c,
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 19,
                  fontWeight: 700,
                }}
              >
                {s.v}
              </div>
              <div style={{ color: muted, fontSize: 11, marginTop: 3 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              color: soft,
              fontSize: 10,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: 9,
            }}
          >
            Breakdown
          </div>
          {questions.map((q, i) => {
            const correct = selected[i] === q.answer,
              skipped = selected[i] === null;
            return (
              <div
                key={q.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 11px',
                  borderRadius: 8,
                  marginBottom: 3,
                  background: correct
                    ? 'rgba(34,197,94,0.05)'
                    : skipped
                    ? 'rgba(100,116,139,0.04)'
                    : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${
                    correct
                      ? 'rgba(34,197,94,0.12)'
                      : skipped
                      ? 'rgba(100,116,139,0.1)'
                      : 'rgba(239,68,68,0.12)'
                  }`,
                }}
              >
                <span
                  style={{
                    color: correct
                      ? '#22C55E'
                      : skipped
                      ? '#6B7280'
                      : '#EF4444',
                    fontSize: 12,
                    width: 14,
                  }}
                >
                  {correct ? '✓' : skipped ? '–' : '✗'}
                </span>
                <span style={{ color: dim, fontSize: 12, flex: 1 }}>
                  Q{q.id}. {q.category}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: correct
                      ? '#22C55E'
                      : skipped
                      ? '#6B7280'
                      : '#EF4444',
                  }}
                >
                  {correct ? '+1' : skipped ? 'Skip' : 'Wrong'}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={onReview}
            style={{
              flex: 1,
              background: '#1F2937',
              color: light,
              border: 'none',
              borderRadius: 10,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Review Answers
          </button>
          <button
            className="btn"
            onClick={onLogout}
            style={{
              flex: 1,
              background: amber,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewScreen ─────────────────────────────────────────────────────────────
function ReviewScreen({ result, onExit }) {
  const [current, setCurrent] = useState(0);
  const { selected } = result;
  const q = questions[current];
  const colors = categoryColors[q.category] || categoryColors['Analytical'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: dark,
        fontFamily: "'Source Serif 4',serif",
        padding: 16,
      }}
    >
      <style>{BASE_CSS}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                color: amberL,
                fontWeight: 900,
                fontSize: 17,
              }}
            >
              APT
            </span>
            <span style={{ color: '#1F2937' }}>|</span>
            <span style={{ color: muted, fontSize: 13 }}>Review Mode</span>
          </div>
          <button
            className="btn"
            onClick={onExit}
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: '#FCA5A5',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '7px 13px',
              fontSize: 13,
            }}
          >
            Exit Review
          </button>
        </div>

        <div
          style={{
            height: 3,
            background: line,
            borderRadius: 2,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((current + 1) / questions.length) * 100}%`,
              background: amberL,
              transition: 'width 0.3s',
            }}
          />
        </div>

        <div
          className="slide-in"
          key={current}
          style={{
            background: card,
            borderRadius: 13,
            padding: 26,
            border: `1px solid ${line}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                background: colors.badge,
                color: colors.text,
                padding: '3px 11px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {q.category}
            </span>
            <span style={{ color: '#374151', fontSize: 12 }}>
              Q{q.id} / {questions.length}
            </span>
          </div>
          <p
            style={{
              color: light,
              fontSize: 'clamp(14px,2.3vw,17px)',
              lineHeight: 1.7,
              marginBottom: 22,
            }}
          >
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {q.options.map((opt, idx) => {
              const isAnswer = q.answer === idx,
                isSel = selected[current] === idx;
              let bg = dark,
                border2 = line,
                color2 = muted,
                icon = null;
              if (isAnswer) {
                bg = 'rgba(34,197,94,0.08)';
                border2 = '#22C55E';
                color2 = '#86EFAC';
                icon = '✓';
              } else if (isSel && !isAnswer) {
                bg = 'rgba(239,68,68,0.08)';
                border2 = '#EF4444';
                color2 = '#FCA5A5';
                icon = '✗';
              }
              return (
                <div
                  key={idx}
                  style={{
                    background: bg,
                    border: `1.5px solid ${border2}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: color2,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      color: '#374151',
                      fontSize: 11,
                      minWidth: 18,
                      fontWeight: 700,
                    }}
                  >
                    {['A', 'B', 'C', 'D'][idx]}.
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {icon && <span>{icon}</span>}
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 18,
              background: dark,
              border: `1px solid ${line}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                color: amberL,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Explanation
            </div>
            <p
              style={{
                color: soft,
                fontSize: 14,
                lineHeight: 1.65,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {q.explanation}
            </p>
          </div>
        </div>

        <div
          style={{ display: 'flex', justifyContent: 'space-between', gap: 9 }}
        >
          <button
            className="btn"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            style={{
              background: card,
              color: current === 0 ? line : soft,
              border: `1px solid ${line}`,
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 14,
              cursor: current === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          {current < questions.length - 1 ? (
            <button
              className="btn"
              onClick={() => setCurrent((c) => c + 1)}
              style={{
                background: card,
                color: soft,
                border: `1px solid ${line}`,
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 14,
              }}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn"
              onClick={onExit}
              style={{
                background: amber,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 22px',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Done
            </button>
          )}
        </div>

        <div
          style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          {questions.map((_, i) => {
            const correct = selected[i] === questions[i].answer,
              skipped = selected[i] === null,
              isCurr = i === current;
            let bg = card,
              border2 = line,
              color2 = muted;
            if (isCurr) {
              bg = amberL;
              border2 = amberL;
              color2 = '#000';
            } else if (correct) {
              bg = 'rgba(34,197,94,0.1)';
              border2 = '#22C55E';
              color2 = '#4ADE80';
            } else if (!skipped) {
              bg = 'rgba(239,68,68,0.1)';
              border2 = '#EF4444';
              color2 = '#FCA5A5';
            }
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: 33,
                  height: 33,
                  borderRadius: 7,
                  background: bg,
                  border: `1.5px solid ${border2}`,
                  color: color2,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  fontFamily: "'Source Serif 4',serif",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState('login');
  const [result, setResult] = useState(null);

  const logout = () => {
    setUser(null);
    setResult(null);
    setPhase('login');
  };

  if (phase === 'login')
    return (
      <LoginScreen
        onLogin={(u) => {
          setUser(u);
          setPhase(u.role === 'admin' ? 'admin' : 'intro');
        }}
      />
    );
  if (phase === 'admin')
    return <AdminDashboard admin={user} onLogout={logout} />;
  if (phase === 'intro')
    return (
      <IntroScreen
        user={user}
        onStart={() => setPhase('quiz')}
        onLogout={logout}
      />
    );
  if (phase === 'quiz')
    return (
      <QuizScreen
        user={user}
        onFinish={(r) => {
          setResult(r);
          setPhase('result');
        }}
      />
    );
  if (phase === 'result')
    return (
      <ResultScreen
        user={user}
        result={result}
        onReview={() => setPhase('review')}
        onLogout={logout}
      />
    );
  if (phase === 'review')
    return <ReviewScreen result={result} onExit={logout} />;
  return null;
}
