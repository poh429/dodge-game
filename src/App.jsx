import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- Firebase Configuration (已替換成你的專屬設定) ---
const firebaseConfig = {
  apiKey: "AIzaSyDRp0wMvoqOVw4p79Z6LMbUzXCZmTcDc5A",
  authDomain: "dodge-two-one.firebaseapp.com",
  projectId: "dodge-two-one",
  storageBucket: "dodge-two-one.firebasestorage.app",
  messagingSenderId: "902082658416",
  appId: "1:902082658416:web:a1ac274e1c873409b774b5",
  measurementId: "G-PEDN7ZCJYK"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 設定一個固定的 App ID，確保所有人連到同一個排行榜
const appId = "survival-game-v1";

// --- Constants & Assets ---
const COLORS = {
  bg: '#2F4F4F', // Dark Slate Gray
  wall: '#8B4513', // Wood
  wallLight: '#D2691E', 
  grid: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  accent: '#FFD700', 
  ball: '#FF4444', 
  ballHighlight: '#FF8888'
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 24; 
const BALL_RADIUS = 12; 
const BASE_SPEED = 5;

const BGM_URL = "https://raw.githubusercontent.com/fernandopicon/game-assets/master/8-bit-music-loop.mp3";

// --- Complete Taiwan Universities List ---
const UNIVERSITIES = [
  // 北部
  "國立臺灣大學", "國立政治大學", "國立清華大學", "國立陽明交通大學", "國立中央大學",
  "國立臺灣師範大學", "國立臺北大學", "國立臺灣海洋大學", "國立臺北教育大學", "國立臺北藝術大學",
  "國立臺灣藝術大學", "國立臺北護理健康大學", "國立臺北商業大學", "國立臺北科技大學", "國立臺灣科技大學",
  "國立臺灣戲曲學院", "國立體育大學", "臺北市立大學",
  "輔仁大學", "東吳大學", "淡江大學", "中原大學", "元智大學", "銘傳大學", "實踐大學",
  "世新大學", "文化大學", "大同大學", "真理大學", "大葉大學", "中華大學", "華梵大學",
  "開南大學", "長庚大學", "佛光大學", "馬偕醫學院", "臺北醫學大學", "法鼓文理學院",
  "明志科技大學", "龍華科技大學", "明新科技大學", "健行科技大學", "萬能科技大學", "玄奘大學",
  "建國科技大學", "明道大學", "聖約翰科技大學", "中國科技大學", "德明財經科技大學", "中華科技大學",
  "臺北城市科技大學", "景文科技大學", "東南科技大學", "醒吾科技大學", "致理科技大學", "亞東科技大學",
  "宏國德霖科技大學", "黎明技術學院", "華夏科技大學", "崇右影藝科技大學", "經國管理暨健康學院",
  "馬偕醫護管理專科學校", "耕莘健康管理專科學校", "新生醫護管理專科學校",

  // 中部
  "國立中興大學", "國立中正大學", "國立彰化師範大學", "國立暨南國際大學", "國立臺中教育大學",
  "國立勤益科技大學", "國立臺中科技大學", "國立雲林科技大學", "國立虎尾科技大學",
  "東海大學", "逢甲大學", "靜宜大學", "亞洲大學", "中山醫學大學", "中國醫藥大學", "南華大學",
  "朝陽科技大學", "弘光科技大學", "嶺東科技大學", "中臺科技大學", "僑光科技大學", "修平科技大學",
  "育達科技大學", "吳鳳科技大學", "環球科技大學", "南開科技大學", "仁德醫護管理專科學校",

  // 南部
  "國立成功大學", "國立中山大學", "國立高雄大學", "國立高雄師範大學", "國立臺南大學",
  "國立屏東大學", "國立高雄科技大學", "國立屏東科技大學", "國立臺南藝術大學", "國立高雄餐旅大學",
  "高雄醫學大學", "義守大學", "長榮大學", "康寧大學", "台南應用科技大學", "南臺科技大學",
  "崑山科技大學", "嘉南藥理大學", "樹德科技大學", "輔英科技大學", "正修科技大學", "高苑科技大學",
  "大仁科技大學", "美和科技大學", "文藻外語大學", "慈惠醫護管理專科學校", "樹人醫護管理專科學校",

  // 東部 & 離島
  "國立東華大學", "國立臺東大學", "國立宜蘭大學", "慈濟大學", "慈濟科技大學", "大漢技術學院",
  "國立金門大學", "國立澎湖科技大學",

  // 軍警院校
  "國防大學", "國防醫學院", "陸軍軍官學校", "海軍軍官學校", "空軍軍官學校", 
  "中央警察大學", "臺灣警察專科學校", "空軍航空技術學院", "陸軍專科學校",

  // 其他
  "其他學校/社會人士"
];

// --- Helper Components ---
const Button = ({ onClick, children, className = "", color = "blue", disabled = false }) => {
  const baseStyle = "px-6 py-3 rounded-full font-bold text-white shadow-lg transform transition border-2 border-white/20 flex items-center justify-center";
  const activeStyle = "hover:scale-105 active:scale-95 cursor-pointer";
  const disabledStyle = "opacity-50 cursor-not-allowed grayscale";
  
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-500",
    green: "bg-green-600 hover:bg-green-500",
    red: "bg-red-600 hover:bg-red-500",
    cyan: "bg-cyan-600 hover:bg-cyan-500",
    gray: "bg-gray-600 hover:bg-gray-500",
    orange: "bg-orange-600 hover:bg-orange-500"
  };
  
  return (
    <button 
      onClick={disabled ? null : onClick} 
      className={`${baseStyle} ${colors[color]} ${disabled ? disabledStyle : activeStyle} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Modal = ({ children }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border-4 border-yellow-500 p-8 rounded-lg max-w-lg w-full text-center shadow-[0_0_20px_rgba(255,215,0,0.3)] relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")'}}></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function TaiwanStudentSurvival() {
  const [gameState, setGameState] = useState('menu'); 
  const [mode, setMode] = useState(1);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  
  // User Input State
  const [playerName, setPlayerName] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolList, setShowSchoolList] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState('ALL'); 
  const [user, setUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); 
  
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const scoreRef = useRef(0);
  const audioRef = useRef(null);
  
  const playersRef = useRef([]);
  const ballsRef = useRef([]);
  const keysPressed = useRef({});
  const lastBallTime = useRef(0);
  const difficultyRef = useRef(1);

  // --- Filtered Schools Logic ---
  const filteredSchools = useMemo(() => {
    if (!schoolSearch) return UNIVERSITIES;
    return UNIVERSITIES.filter(u => u.includes(schoolSearch));
  }, [schoolSearch]);

  // --- Audio Logic ---
  useEffect(() => {
    audioRef.current = new Audio(BGM_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted || gameState !== 'playing') {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) playPromise.catch(() => {});
      }
    }
  }, [isMuted, gameState]);

  const toggleMute = () => setIsMuted(!isMuted);

  // --- Firebase Init ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth); 
      } catch (e) { 
        console.error("Auth Error:", e); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'taiwan-student-scores');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      scores.sort((a, b) => b.score - a.score);
      setLeaderboard(scores);
    });
    return () => unsubscribe();
  }, [user]);

  // --- Auto-Submit Logic ---
  useEffect(() => {
    if (gameState === 'gameover') {
      autoSubmitScore();
    }
  }, [gameState]);

  const autoSubmitScore = async () => {
    if (!playerName.trim() || !user) {
      setUploadStatus('error');
      return;
    }
    setUploadStatus('uploading');
    const currentNewScore = scoreRef.current;
    const modeStr = mode === 1 ? '1P' : '2P';

    const docId = `${user.uid}_${modeStr}`;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'taiwan-student-scores', docId);

    try {
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const oldScore = data.score || 0;

        if (currentNewScore > oldScore) {
          await setDoc(docRef, {
            name: playerName.trim(),
            school: selectedSchool || '未知大學',
            score: currentNewScore,
            mode: modeStr,
            uid: user.uid,
            timestamp: serverTimestamp()
          });
          setUploadStatus('success'); 
        } else {
          setUploadStatus('skipped'); 
        }
      } else {
        await setDoc(docRef, {
          name: playerName.trim(),
          school: selectedSchool || '未知大學',
          score: currentNewScore,
          mode: modeStr,
          uid: user.uid,
          timestamp: serverTimestamp()
        });
        setUploadStatus('success');
      }

    } catch (e) {
      console.error("Error submitting score:", e);
      setUploadStatus('error');
    }
  };

  // --- Game Flow ---
  const prepareGame = (selectedMode) => {
    setMode(selectedMode);
    setGameState('input_name');
  };

  const startGame = () => {
    if (!playerName.trim() || !selectedSchool) {
      alert("請輸入暱稱並選擇學校！");
      return;
    }

    setScore(0);
    scoreRef.current = 0;
    difficultyRef.current = 1;
    lastBallTime.current = 0;
    ballsRef.current = [];
    setUploadStatus('');
    
    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT / 2;
    
    if (mode === 1) {
      playersRef.current = [{ x: startX, y: startY, type: 0, id: 'p1', dead: false, deathTime: null, invincibleUntil: 0 }];
    } else {
      playersRef.current = [
        { x: startX - 40, y: startY, type: 0, id: 'p1', dead: false, deathTime: null, invincibleUntil: 0 },
        { x: startX + 40, y: startY, type: 1, id: 'p2', dead: false, deathTime: null, invincibleUntil: 0 }
      ];
    }
    setGameState('playing');
  };

  const spawnBall = () => {
    const corners = [
      { x: 40, y: 40 },
      { x: GAME_WIDTH - 40, y: 40 },
      { x: 40, y: GAME_HEIGHT - 40 },
      { x: GAME_WIDTH - 40, y: GAME_HEIGHT - 40 }
    ];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    const alivePlayers = playersRef.current.filter(p => !p.dead);
    if (alivePlayers.length === 0) return;
    
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    const angle = Math.atan2(target.y - corner.y, target.x - corner.x);
    const randomAngle = angle + (Math.random() - 0.5) * 0.4; 
    
    // UPDATED: Slower speed scaling
    const speed = 3 + (difficultyRef.current * 0.4); 
    
    ballsRef.current.push({
      x: corner.x, y: corner.y,
      vx: Math.cos(randomAngle) * speed, vy: Math.sin(randomAngle) * speed,
      radius: BALL_RADIUS,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  };

  const update = (time) => {
    if (gameState !== 'playing') return;

    difficultyRef.current = 1 + Math.floor(scoreRef.current / 500); 
    
    let currentSpawnRate = 1500 - (scoreRef.current * 0.6);
    currentSpawnRate = Math.max(300, currentSpawnRate);

    if (time - lastBallTime.current > currentSpawnRate) {
      spawnBall();
      lastBallTime.current = time;
    }

    playersRef.current.forEach(p => {
      if (p.dead) return;
      let dx = 0, dy = 0;
      const speed = BASE_SPEED;

      if (p.id === 'p1') { 
        if (keysPressed.current['ArrowUp']) dy -= speed;
        if (keysPressed.current['ArrowDown']) dy += speed;
        if (keysPressed.current['ArrowLeft']) dx -= speed;
        if (keysPressed.current['ArrowRight']) dx += speed;
      } else if (p.id === 'p2') { 
        if (keysPressed.current['w'] || keysPressed.current['W']) dy -= speed;
        if (keysPressed.current['s'] || keysPressed.current['S']) dy += speed;
        if (keysPressed.current['a'] || keysPressed.current['A']) dx -= speed;
        if (keysPressed.current['d'] || keysPressed.current['D']) dx += speed;
      }

      p.x = Math.max(PLAYER_SIZE, Math.min(GAME_WIDTH - PLAYER_SIZE, p.x + dx));
      p.y = Math.max(PLAYER_SIZE, Math.min(GAME_HEIGHT - PLAYER_SIZE, p.y + dy));
    });

    ballsRef.current.forEach(ball => {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.rotation += ball.rotationSpeed;

      if (ball.x < 0 || ball.x > GAME_WIDTH) { ball.vx *= -1; ball.x = Math.max(0, Math.min(GAME_WIDTH, ball.x)); }
      if (ball.y < 0 || ball.y > GAME_HEIGHT) { ball.vy *= -1; ball.y = Math.max(0, Math.min(GAME_HEIGHT, ball.y)); }

      playersRef.current.forEach(p => {
        if (p.dead) return;
        if (p.invincibleUntil && time < p.invincibleUntil) return;
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < ball.radius + PLAYER_SIZE/1.8) {
          p.dead = true;
          p.deathTime = time;
        }
      });
    });

    // Respawn logic for 2P: if partner survives 8s, revive at center with 1s invincibility
    if (mode === 2) {
      const alivePlayers = playersRef.current.filter(p => !p.dead);
      const deadPlayers = playersRef.current.filter(p => p.dead && p.deathTime != null);
      if (alivePlayers.length === 1 && deadPlayers.length >= 1) {
        deadPlayers.forEach(p => {
          if (time - p.deathTime >= 8000) {
            p.dead = false;
            p.deathTime = null;
            p.x = GAME_WIDTH / 2;
            p.y = GAME_HEIGHT / 2;
            p.invincibleUntil = time + 1000;
          }
        });
      }
    }

    if (playersRef.current.every(p => p.dead)) {
      setFinalScore(Math.floor(scoreRef.current));
      setGameState('gameover');
    } else {
      scoreRef.current += 1;
      setScore(Math.floor(scoreRef.current));
    }
  };

  const drawStudent = (ctx, x, y, type) => {
    const shirtColor = type === 0 ? '#4682B4' : '#FF8C00';
    
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(-14, -8, 28, 16); 

    ctx.fillStyle = shirtColor;
    ctx.fillRect(-10, -5, 20, 18);
    
    ctx.fillStyle = '#191970';
    ctx.fillRect(-10, 13, 9, 8);
    ctx.fillRect(1, 13, 9, 8);

    ctx.fillStyle = '#FFCC99'; 
    ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(0, -12, 10, Math.PI, 0); ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, -10); ctx.stroke();
    ctx.strokeRect(-8, -12, 6, 4); ctx.strokeRect(2, -12, 6, 4);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type === 0 ? 'P1' : 'P2', 0, -25);

    ctx.restore();
  };

  const drawProfessor = (ctx, x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#4B0082'; 
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F0E68C'; 
    ctx.beginPath(); ctx.arc(0, -5, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillRect(-15, -20, 30, 5);
    ctx.fillRect(-5, -20, 10, -5);
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ò_Ó', 0, -2);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('F', 15, 15);
    ctx.restore();
  };

  const drawFGrade = (ctx, ball) => {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    
    const gradient = ctx.createRadialGradient(-2, -2, 2, 0, 0, ball.radius);
    gradient.addColorStop(0, COLORS.ballHighlight);
    gradient.addColorStop(1, COLORS.ball);
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', 0, 1);
    
    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
    }
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
    }

    ctx.lineWidth = 12;
    ctx.strokeStyle = COLORS.wall;
    ctx.strokeRect(6, 6, GAME_WIDTH-12, GAME_HEIGHT-12);

    drawProfessor(ctx, 35, 35);
    drawProfessor(ctx, GAME_WIDTH - 35, 35);
    drawProfessor(ctx, 35, GAME_HEIGHT - 35);
    drawProfessor(ctx, GAME_WIDTH - 35, GAME_HEIGHT - 35);

    playersRef.current.forEach(p => {
      if (!p.dead) drawStudent(ctx, p.x, p.y, p.type);
    });

    ballsRef.current.forEach(ball => drawFGrade(ctx, ball));
  };

  const loop = (time) => {
    update(time);
    draw();
    if (gameState === 'playing') requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(loop);
      const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
      const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        cancelAnimationFrame(requestRef.current);
      };
    }
  }, [gameState]);

  const filteredLeaderboard = useMemo(() => {
    if (leaderboardFilter === 'ALL') return leaderboard.slice(0, 10);
    return leaderboard.filter(item => item.mode === leaderboardFilter).slice(0, 10);
  }, [leaderboard, leaderboardFilter]);

  return (
    <div className="w-full min-h-screen bg-stone-900 flex flex-col items-center justify-center font-sans text-white p-4 select-none">
      
      <button onClick={toggleMute} className="absolute top-4 left-4 bg-gray-800 p-3 rounded-full hover:bg-gray-700 z-50 border border-gray-600">
        {isMuted ? "🔇" : "🔊"}
      </button>

      <div className="mb-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-2 text-yellow-400 drop-shadow-md tracking-wider">
          台灣大學生：閃避二一
        </h1>
        <p className="text-red-300 font-bold text-lg tracking-widest">DODGE THE "F" - SURVIVAL GAME</p>
      </div>

      <div className="relative group shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border-8 border-yellow-900">
        <canvas 
          ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT}
          className="bg-black max-w-full h-auto cursor-none"
        />
        
        {gameState === 'playing' && (
          <div className="absolute top-4 left-0 right-0 flex justify-between px-8 text-xl font-bold pointer-events-none">
            <span className="text-white drop-shadow-md bg-black/30 px-2 rounded">
              {mode === 1 ? `${selectedSchool} - ${playerName}` : `TEAM: ${playerName}`}
            </span>
            <div className="text-white drop-shadow-md bg-black/30 px-2 rounded">學分 (Score): <span className="text-yellow-400">{score}</span></div>
          </div>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
            <div className="mb-8 text-3xl font-bold text-white text-center">
              選擇挑戰模式<br/>
              <span className="text-sm text-gray-400 font-normal">Choose Your Mode</span>
            </div>
            <div className="flex gap-8">
              <div onClick={() => prepareGame(1)} className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center gap-2 group">
                <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center border-4 border-blue-400 shadow-lg">
                  <span className="text-2xl font-bold text-center">單人<br/>求生</span>
                </div>
                <div className="opacity-70 group-hover:opacity-100 text-sm text-gray-300">方向鍵移動</div>
              </div>

              <div onClick={() => prepareGame(2)} className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center gap-2 group">
                <div className="w-32 h-32 bg-orange-600 rounded-full flex items-center justify-center border-4 border-orange-400 shadow-lg">
                  <span className="text-2xl font-bold text-center">雙人<br/>合作</span>
                </div>
                <div className="opacity-70 group-hover:opacity-100 text-sm text-gray-300">方向鍵 + WASD</div>
              </div>
            </div>
            <div className="mt-12">
               <Button onClick={() => setGameState('leaderboard')} color="cyan" className="text-sm">
                  🏆 查看榮譽榜 (Leaderboard)
               </Button>
            </div>
          </div>
        )}

        {gameState === 'input_name' && (
          <Modal>
             <h2 className="text-2xl font-black text-yellow-400 mb-4">
               {mode === 1 ? '建立學生檔案' : '建立隊伍檔案'}
             </h2>
             
             <div className="space-y-4 mb-6 text-left">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">暱稱 / ID</label>
                  <input 
                    type="text" maxLength={12}
                    value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="輸入你的名字"
                    className="bg-gray-800 border-2 border-gray-600 text-white py-2 px-3 rounded w-full outline-none focus:border-yellow-400"
                  />
                </div>

                {mode === 1 && (
                  <div className="relative">
                    <label className="block text-gray-400 text-sm mb-1">所屬學校 (School)</label>
                    <input 
                      type="text"
                      value={selectedSchool ? selectedSchool : schoolSearch}
                      onChange={(e) => {
                        setSchoolSearch(e.target.value);
                        setSelectedSchool(''); 
                        setShowSchoolList(true);
                      }}
                      onFocus={() => setShowSchoolList(true)}
                      placeholder="搜尋學校 (例如: 台大)"
                      className="bg-gray-800 border-2 border-gray-600 text-white py-2 px-3 rounded w-full outline-none focus:border-yellow-400"
                    />
                    {showSchoolList && schoolSearch && !selectedSchool && (
                      <div className="absolute z-50 w-full bg-gray-800 border border-gray-600 max-h-40 overflow-y-auto mt-1 rounded shadow-xl custom-scrollbar">
                        {filteredSchools.length > 0 ? (
                          filteredSchools.map(school => (
                            <div 
                              key={school}
                              onClick={() => {
                                setSelectedSchool(school);
                                setSchoolSearch(school);
                                setShowSchoolList(false);
                              }}
                              className="px-3 py-2 hover:bg-blue-600 cursor-pointer text-sm text-gray-200"
                            >
                              {school}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">找不到學校...</div>
                        )}
                      </div>
                    )}
                    {selectedSchool && (
                      <div className="mt-1 text-green-400 text-xs text-right">✓ 已選擇: {selectedSchool}</div>
                    )}
                  </div>
                )}
             </div>

             <div className="flex justify-center gap-4 mt-8">
                <Button 
                  onClick={startGame} 
                  color="green" 
                  disabled={!playerName.trim() || (mode === 1 && !selectedSchool)}
                >
                  開始挑戰
                </Button>
                <Button onClick={() => setGameState('menu')} color="red">取消</Button>
             </div>
          </Modal>
        )}

        {gameState === 'gameover' && (
          <Modal>
            <h2 className="text-4xl font-black text-red-500 mb-2">被當了!!! (FAILED)</h2>
            <div className="text-6xl mb-4">😭</div>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-600">
               <div className="text-gray-400 text-sm mb-1">{selectedSchool}</div>
               <div className="text-xl font-bold text-white mb-2">{playerName}</div>
               <div className="h-px bg-gray-600 w-full my-2"></div>
               <p className="text-gray-400 text-sm">生存分數 (Score)</p>
               <div className="text-5xl text-yellow-400 font-mono">{finalScore}</div>
            </div>

            <div className="flex flex-col items-center gap-2 justify-center mt-4">
              {uploadStatus === 'uploading' && <span className="text-cyan-400 animate-pulse font-bold text-xs">正在確認成績...</span>}
              {uploadStatus === 'success' && <span className="text-green-500 font-bold text-xs">🎉 新紀錄已儲存！</span>}
              {uploadStatus === 'skipped' && <span className="text-gray-400 font-bold text-xs">📉 未破個人紀錄 (不更新)</span>}
              {uploadStatus === 'error' && <span className="text-red-500 font-bold text-xs">❌ 上傳失敗 (請刷新頁面重試)</span>}
              
              <div className="flex gap-2 mt-2">
                <Button onClick={() => setGameState('leaderboard')} color="blue" className="py-2 px-6">
                  查看排名
                </Button>
                <Button onClick={() => setGameState('menu')} color="gray" className="py-2 px-6">
                  主選單
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {gameState === 'leaderboard' && (
          <Modal>
            <h2 className="text-3xl font-black text-yellow-400 mb-4">🏆 校際英雄榜</h2>
            
            <div className="flex justify-center gap-2 mb-4">
              {['ALL', '1P', '2P'].map(filter => (
                <button
                  key={filter} onClick={() => setLeaderboardFilter(filter)}
                  className={`px-4 py-1 rounded-t-lg font-bold border-b-2 ${
                    leaderboardFilter === filter ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800 text-gray-400 border-transparent'
                  }`}
                >
                  {filter === 'ALL' ? '全部' : filter}
                </button>
              ))}
            </div>

            <div className="bg-black/50 rounded-lg overflow-hidden border border-gray-600 mb-6 max-h-[280px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800 text-gray-300 sticky top-0">
                  <tr>
                    <th className="p-2 text-center w-12">#</th>
                    <th className="p-2">學校 / 玩家</th>
                    <th className="p-2 text-right">分數</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLeaderboard.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-500">尚無紀錄，快來搶頭香！</td></tr>
                  ) : (
                    filteredLeaderboard.map((entry, idx) => (
                      <tr key={entry.id} className={`${entry.name === playerName && entry.score === finalScore ? 'bg-yellow-900/40' : 'hover:bg-white/5'} transition-colors`}>
                        <td className="p-2 text-center font-bold text-yellow-500">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-bold text-white flex items-center gap-2">
                             {entry.name}
                             {entry.name === playerName && entry.score === finalScore && <span className="text-[10px] bg-yellow-600 px-1 rounded text-black font-bold">YOU</span>}
                          </div>
                          <div className="text-xs text-cyan-300">{entry.school}</div>
                        </td>
                        <td className="p-2 text-right text-green-400 font-mono text-base font-bold">{entry.score}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Button onClick={() => setGameState('menu')} color="green">回主選單</Button>
          </Modal>
        )}
      </div>

      <div className="mt-4 text-gray-400 text-xs">
        <p>玩法：單人模式使用 [方向鍵]，雙人模式加入 [WASD]。</p>
        <p>目標：閃避教授丟出的 "F" (不及格)，活得越久分數越高！</p>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
