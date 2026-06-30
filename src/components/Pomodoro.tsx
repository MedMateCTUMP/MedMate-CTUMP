import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Award, 
  Coffee, 
  Sparkles, 
  Sliders, 
  Settings, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { Subject } from '../types';

interface PomodoroProps {
  subjects: Subject[];
  onAwardPoints: (points: number, reason: string) => Promise<void>;
}

export default function Pomodoro({ subjects, onAwardPoints }: PomodoroProps) {
  // Predefined options in minutes
  const PRESET_TIMES = [
    { label: 'Tiêu chuẩn (25p)', value: 25 },
    { label: 'Sâu (50p)', value: 50 },
    { label: 'Cực hạn (90p)', value: 90 }
  ];

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Custom minutes input state
  const [customMins, setCustomMins] = useState('25');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Audio mute/unmute state (for bell alert)
  const [isMuted, setIsMuted] = useState(false);

  // Stats
  const [completedSessions, setCompletedSessions] = useState(0);

  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = useRef(25 * 60); // Total seconds

  // Initialize selected subject with first subject if available
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  // Set total duration when minutes change
  const handleSetTime = (mins: number) => {
    setMinutes(mins);
    setSeconds(0);
    setIsActive(false);
    setMode('study');
    totalDuration.current = mins * 60;
  };

  // Timer loop
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(prev => prev - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer Finished!
            handleTimerComplete();
          } else {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    // Play sound alert (using standard browser AudioContext to construct synthetic pleasant chime so it works natively with no assets required!)
    if (!isMuted) {
      playChime();
    }

    if (mode === 'study') {
      const subjectObj = subjects.find(s => s.id === selectedSubject);
      const subName = subjectObj ? subjectObj.name : 'ôn bài tự do';
      const xpReward = 50;

      try {
        await onAwardPoints(xpReward, `Hoàn thành Pomodoro ${totalDuration.current / 60} phút: Môn ${subName}`);
        setCompletedSessions(prev => prev + 1);
        alert(`🎉 Chúc mừng! Bạn đã hoàn thành xuất sắc chu kỳ Pomodoro tập trung cho môn ${subName}.\nBạn được cộng ngay +${xpReward} XP điểm thưởng!`);
      } catch (err) {
        console.error('Failed to award points', err);
      }

      // Automatically shift to break mode
      setMode('break');
      const breakMinutes = totalDuration.current >= 3000 ? 10 : 5; // 10 mins break for 50+ mins study, else 5 mins
      setMinutes(breakMinutes);
      setSeconds(0);
      totalDuration.current = breakMinutes * 60;
    } else {
      // Break over
      alert(`🔔 Hết giờ nghỉ ngơi rồi sinh viên Y Dược ơi! Hãy chọn môn học và bắt đầu chu kỳ tập trung học tiếp theo nhé.`);
      setMode('study');
      handleSetTime(25);
    }
  };

  // Synthetic beep sound (nice modern chime)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      // Joyous dual notes
      playNote(523.25, audioCtx.currentTime, 0.4); // C5
      playNote(659.25, audioCtx.currentTime + 0.15, 0.5); // E5
    } catch (e) {
      console.log('AudioContext blocked or unsupported');
    }
  };

  const handleStartPause = () => {
    if (subjects.length === 0 && mode === 'study') {
      alert('Vui lòng thêm ít nhất một môn học trong phần "Môn học" trước khi học Pomodoro!');
      return;
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    const mins = showCustomInput ? Number(customMins) : 25;
    handleSetTime(isNaN(mins) ? 25 : mins);
  };

  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(customMins);
    if (isNaN(mins) || mins <= 0 || mins > 360) {
      alert('Vui lòng điền số phút hợp lệ (1 - 360 phút).');
      return;
    }
    handleSetTime(mins);
    setShowCustomInput(false);
  };

  // ================= CALCULATE CIRCULAR ARC =================
  const timeLeftInSeconds = minutes * 60 + seconds;
  const percentage = totalDuration.current > 0 
    ? (timeLeftInSeconds / totalDuration.current) * 100 
    : 100;

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-100 p-6 rounded-[22px] shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Timer className="w-8 h-8 text-[#0f766e]" />
          <span>Tập trung Pomodoro</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1.5">Tối đa hóa khả năng ghi nhớ lượng dược lý, giải phẫu khổng lồ bằng chu kỳ tập trung học sâu không sao nhãng.</p>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Circular Timer visual card */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 lg:col-span-8 flex flex-col items-center justify-center space-y-8 shadow-sm min-h-[460px]">
          
          {/* Mode Badge indicator */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
              mode === 'study'
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {mode === 'study' ? '📚 Học tập tập trung' : '☕ Thời gian giải lao'}
            </span>

            {/* Mute toggle button */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title={isMuted ? "Bật âm thanh báo chuông" : "Tắt âm thanh chuông"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#0f766e]" />}
            </button>
          </div>

          {/* Large Circular Display */}
          <div className="relative w-64 h-64 flex items-center justify-center select-none">
            {/* SVG circle track and dynamic value */}
            <svg className="absolute w-full h-full -rotate-90">
              {/* Back track circle */}
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-slate-100 stroke-[8]"
                fill="transparent"
              />
              {/* Front progress circle arc */}
              <circle
                cx="128"
                cy="128"
                r={radius}
                className={`stroke-[8] transition-all duration-300 rounded-full`}
                stroke={mode === 'study' ? '#0f766e' : '#d97706'}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Digital Clock texts inside */}
            <div className="relative z-10 text-center">
              <span className="block text-5xl font-mono font-black tracking-tight text-slate-900">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 block">
                {isActive ? 'ĐANG CHẠY' : 'ĐÃ TẠM DỪNG'}
              </span>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-4 pt-2">
            
            {/* Reset button */}
            <button
              onClick={handleReset}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-2xl border border-slate-200 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Start / Pause button */}
            <button
              onClick={handleStartPause}
              className={`py-4 px-10 rounded-2xl font-black text-sm tracking-wide transition-all hover:scale-[103%] active:scale-[97%] duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isActive 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-[#0f766e] hover:bg-[#0d615a] text-white'
              }`}
            >
              {isActive ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5" />}
              <span>{isActive ? 'Tạm dừng học' : 'Bắt đầu đếm ngược'}</span>
            </button>

          </div>

        </div>

        {/* Right column: Config settings & Stats */}
        <div className="bg-white border border-slate-100 rounded-[22px] p-6 lg:col-span-4 space-y-6 shadow-sm">
          
          {/* Section 1: Target Subject Link */}
          {mode === 'study' && (
            <div className="space-y-2.5">
              <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Môn học tập trung</h3>
              
              {subjects.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-rose-500 font-medium">
                  Chưa có môn học! Vui lòng tạo môn học trong mục "Môn học" trước.
                </div>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={isActive}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-800 text-xs font-bold rounded-xl py-2.5 px-4 focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Section 2: Quick intervals select */}
          <div className="space-y-3">
            <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Khoảng thời gian chọn nhanh</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {PRESET_TIMES.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSetTime(preset.value)}
                  disabled={isActive}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all hover:scale-[102%] active:scale-[98%] duration-150 cursor-pointer ${
                    minutes === preset.value && !showCustomInput
                      ? 'bg-[#0f766e] text-white border-teal-700 shadow-md shadow-teal-900/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  ⏱ {preset.label}
                </button>
              ))}

              {/* Custom Minutes Input option Toggle */}
              {!showCustomInput ? (
                <button
                  onClick={() => { setShowCustomInput(true); setIsActive(false); }}
                  className="w-full text-left p-3.5 rounded-2xl border bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 text-xs font-bold transition-all hover:scale-[102%] active:scale-[98%] duration-150 cursor-pointer hover:bg-white"
                >
                  ⚙️ Tùy chỉnh số phút...
                </button>
              ) : (
                <form onSubmit={handleApplyCustomTime} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      max="360"
                      value={customMins}
                      onChange={(e) => setCustomMins(e.target.value)}
                      className="w-20 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl p-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">phút tập trung</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg text-slate-600 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 duration-150 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d615a] active:bg-[#094742] text-white font-bold rounded-lg text-[10px] transition-all hover:scale-105 active:scale-95 duration-150 cursor-pointer shadow-sm"
                    >
                      Áp dụng
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Section 3: Pomodoro completed badges stats */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs text-slate-600 font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0f766e]" />
              <span>Thành tựu phiên học hôm nay</span>
            </h4>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Chu kỳ đã hoàn tất:</span>
              <span className="text-sm font-black text-slate-800">{completedSessions} chu kỳ</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500 font-medium">Tổng điểm XP tích luỹ:</span>
              <span className="text-sm font-black text-teal-700">+{completedSessions * 50} XP</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
