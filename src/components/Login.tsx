import React, { useState, useRef } from 'react';
import { Mail, ShieldCheck, RefreshCw, KeyRound, GraduationCap, AlertCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLoginSuccess: (token: string, user: UserProfile) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setOtpSent(true);
        setTestOtp(data.otp); // Save the test OTP to help the tester!
        setInfoMsg(data.message);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi gửi OTP.');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối với máy chủ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtpValues = [...otpValues];
    // Keep only the last character entered
    newOtpValues[index] = value.substring(value.length - 1);
    setOtpValues(newOtpValues);

    // If a number was entered, shift focus to the next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      // Shift focus to the previous input on backspace if current is empty
      const newOtpValues = [...otpValues];
      newOtpValues[index - 1] = '';
      setOtpValues(newOtpValues);
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const splitOtp = pastedData.split('');
      setOtpValues(splitOtp);
      otpInputs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp })
      });
      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setErrorMsg(data.error || 'Mã OTP không đúng hoặc đã hết hạn.');
      }
    } catch (err) {
      setErrorMsg('Không thể xác minh OTP. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmail = () => {
    setOtpSent(false);
    setOtpValues(['', '', '', '', '', '']);
    setTestOtp(null);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-hidden relative z-10 transition-all duration-300">
        
        {/* CTUMP MedMate Brand Header */}
        <div className="px-8 pt-8 pb-6 text-center bg-[#0f766e] text-white">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/15 flex items-center justify-center mb-4 shadow-lg border border-white/10">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">MedMate CTUMP</h1>
          <p className="text-xs text-teal-100/80 mt-2 font-medium uppercase tracking-wider">
            Cổng quản lý học tập Y khoa Thông minh
          </p>
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          {/* Alerts Area */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-100 flex gap-3 text-teal-700 text-sm">
              <Sparkles className="w-5 h-5 shrink-0 text-teal-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Verification Notification Box for Instant Preview Sandbox Testing */}
          {testOtp && otpSent && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-sm mb-1 text-amber-800">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Môi trường thử nghiệm AI Studio:</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed mb-2">
                Mã OTP 6 số để đăng nhập tài khoản của bạn là:
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-black tracking-widest text-slate-800 bg-white px-4 py-1.5 rounded-xl border border-amber-200">
                  {testOtp}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const split = testOtp.split('');
                    setOtpValues(split);
                    setInfoMsg('Đã tự động điền mã OTP vào các ô nhập!');
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Điền nhanh
                </button>
              </div>
            </div>
          )}

          {/* Form Step 1: Email Input */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Địa chỉ Email sinh viên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: svyctump@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white text-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-medium">
                  * Nhập email cá nhân hoặc email trường (@ctump.edu.vn) để nhận mã bảo mật xác minh OTP 6 số.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0f766e] hover:bg-[#0d615a] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-teal-900/10 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý gửi mã...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    <span>Gửi mã OTP xác minh</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form Step 2: 6-digit OTP Inputs */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Nhập mã bảo mật OTP (6 số)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetEmail}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
                  >
                    Đổi email khác
                  </button>
                </div>
                
                {/* 6 Grid Inputs */}
                <div className="flex justify-between gap-2.5 my-4" onPaste={handlePaste}>
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      ref={(el) => { otpInputs.current[idx] = el; }}
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-14 bg-slate-50 border-2 border-slate-200 focus:border-teal-500 focus:bg-white text-slate-800 rounded-xl text-center text-xl font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-xs mt-3 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Xác thực OTP giúp bảo vệ tuyệt đối các dữ liệu học tập cá nhân.</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="Gửi lại mã OTP"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Gửi lại mã</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1.5 py-3 bg-[#0f766e] hover:bg-[#0d615a] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-900/10"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>Xác minh & Đăng nhập</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Support Credits */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold">
            Hỗ trợ Sinh viên Y Dược Cần Thơ © {new Date().getFullYear()} CTUMP.
          </p>
        </div>

      </div>
    </div>
  );
}
