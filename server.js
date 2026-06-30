"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const vite_1 = require("vite");
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 3000;
const DB_FILE = path_1.default.join(process.cwd(), "db.json");
// Middleware
app.use(express_1.default.json());
// Initialize Local JSON Database with CTUMP Mock Data for onboarding
const initDb = () => {
    if (!fs_1.default.existsSync(DB_FILE)) {
        const initialData = {
            users: {
                "dd0369797@gmail.com": {
                    email: "dd0369797@gmail.com",
                    points: 150,
                    streak: 5,
                    lastActiveDate: new Date().toISOString().split("T")[0],
                },
                "default@ctump.edu.vn": {
                    email: "default@ctump.edu.vn",
                    points: 100,
                    streak: 3,
                    lastActiveDate: new Date().toISOString().split("T")[0],
                }
            },
            subjects: [
                { id: "sub-1", name: "Giải phẫu học II", color: "#0f766e", targetHours: 10 },
                { id: "sub-2", name: "Dược lý học lâm sàng", color: "#d97706", targetHours: 8 },
                { id: "sub-3", name: "Bệnh học nội khoa", color: "#be123c", targetHours: 12 },
                { id: "sub-4", name: "Ngoại khoa cơ sở", color: "#6d28d9", targetHours: 6 }
            ],
            sessions: [
                {
                    id: "sess-1",
                    subjectId: "sub-1",
                    title: "Học các nhánh động mạch chủ bụng",
                    startTime: `${new Date().toISOString().split("T")[0]}T08:00:00`,
                    endTime: `${new Date().toISOString().split("T")[0]}T10:00:00`,
                    location: "Giảng đường khoa Y",
                    notes: "Tập trung phần động mạch chậu chung và động mạch thận",
                    status: "done",
                    syncedToGoogle: true
                },
                {
                    id: "sess-2",
                    subjectId: "sub-2",
                    title: "Cơ chế tác dụng của kháng sinh Beta-lactam",
                    startTime: `${new Date().toISOString().split("T")[0]}T14:00:00`,
                    endTime: `${new Date().toISOString().split("T")[0]}T15:30:00`,
                    location: "Thư viện CTUMP",
                    notes: "Phân biệt penicillin và cephalosporin thế hệ 1-4",
                    status: "planned",
                    syncedToGoogle: false
                },
                {
                    id: "sess-3",
                    subjectId: "sub-3",
                    title: "Triệu chứng học thấp tim tiến triển",
                    startTime: `${new Date(Date.now() + 86400000).toISOString().split("T")[0]}T09:00:00`,
                    endTime: `${new Date(Date.now() + 86400000).toISOString().split("T")[0]}T11:00:00`,
                    location: "Bệnh viện ĐKTW Cần Thơ",
                    notes: "Lâm sàng tim mạch buổi sáng",
                    status: "planned",
                    syncedToGoogle: false
                }
            ],
            screenTime: [
                { id: "st-1", appName: "Facebook", minutes: 35, date: new Date().toISOString().split("T")[0] },
                { id: "st-2", appName: "TikTok", minutes: 42, date: new Date().toISOString().split("T")[0] },
                { id: "st-3", appName: "MedMate (Học tập)", minutes: 120, date: new Date().toISOString().split("T")[0] },
                { id: "st-4", appName: "Youtube Y học", minutes: 50, date: new Date().toISOString().split("T")[0] }
            ],
            appLimits: [
                { id: "lim-1", appName: "TikTok", limitMinutes: 30 },
                { id: "lim-2", appName: "Facebook", limitMinutes: 45 }
            ],
            pointLogs: [
                { id: "pl-1", reason: "Hoàn thành Pomodoro 25 phút: Giải phẫu động mạch", points: 50, timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
                { id: "pl-2", reason: "Hoàn thành lịch học: Giải phẫu học II", points: 50, timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
                { id: "pl-3", reason: "Điểm danh hàng ngày (Daily Streak x5)", points: 50, timestamp: new Date().toISOString() }
            ],
            otps: {}
        };
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
};
initDb();
const readDb = () => {
    try {
        const data = fs_1.default.readFileSync(DB_FILE, "utf8");
        return JSON.parse(data);
    }
    catch (e) {
        console.error("Error reading DB:", e);
        return { users: {}, subjects: [], sessions: [], screenTime: [], appLimits: [], pointLogs: [], otps: {} };
    }
};
const writeDb = (data) => {
    try {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    }
    catch (e) {
        console.error("Error writing DB:", e);
    }
};
// Lazy initialization of Gemini client to prevent crashes if key is missing
let aiClient = null;
const getGeminiClient = () => {
    if (!aiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
            try {
                aiClient = new genai_1.GoogleGenAI({
                    apiKey: apiKey,
                    httpOptions: {
                        headers: {
                            "User-Agent": "aistudio-build",
                        },
                    },
                });
            }
            catch (err) {
                console.error("Failed to initialize Gemini Client:", err);
            }
        }
    }
    return aiClient;
};
// ================= API ENDPOINTS =================
// Auth 1: Send OTP (Email)
app.post("/api/auth/send-otp", (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Email không hợp lệ" });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins expiry
    const db = readDb();
    if (!db.otps)
        db.otps = {};
    db.otps[email] = { otp, expires };
    writeDb(db);
    console.log(`[AUTH] OTP for ${email}: ${otp}`);
    // Return success. Return OTP in response as well to make testing/preview extremely smooth inside the iframe!
    return res.json({
        message: "Mã OTP đã được gửi thành công đến email của bạn.",
        email,
        otp, // Expose OTP for testing in the preview context so user does not need to search terminal logs!
        note: "Vì môi trường thử nghiệm, mã OTP được tự động hiển thị để bạn tiện đăng nhập nhanh."
    });
});
// Auth 2: Verify OTP
app.post("/api/auth/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "Email và OTP là bắt buộc" });
    }
    const db = readDb();
    const stored = db.otps ? db.otps[email] : null;
    if (!stored) {
        return res.status(400).json({ error: "Không tìm thấy yêu cầu gửi mã cho email này" });
    }
    if (Date.now() > stored.expires) {
        return res.status(400).json({ error: "Mã OTP đã hết hạn (5 phút)" });
    }
    if (stored.otp !== otp) {
        return res.status(400).json({ error: "Mã OTP không chính xác. Vui lòng thử lại!" });
    }
    // OTP verified! Create user profile if not exists
    if (!db.users)
        db.users = {};
    if (!db.users[email]) {
        db.users[email] = {
            email,
            points: 100, // Onboarding reward
            streak: 1,
            lastActiveDate: new Date().toISOString().split("T")[0]
        };
        db.pointLogs.push({
            id: `pl-${Date.now()}`,
            reason: "Thành viên mới gia nhập MedMate CTUMP",
            points: 100,
            timestamp: new Date().toISOString()
        });
    }
    else {
        // Check and update streak
        const todayStr = new Date().toISOString().split("T")[0];
        const user = db.users[email];
        if (user.lastActiveDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            if (user.lastActiveDate === yesterdayStr) {
                user.streak = (user.streak || 0) + 1;
            }
            else {
                user.streak = 1;
            }
            user.lastActiveDate = todayStr;
            // Bonus streak points
            const streakBonus = user.streak * 10;
            user.points = (user.points || 0) + streakBonus;
            db.pointLogs.push({
                id: `pl-${Date.now()}`,
                reason: `Điểm danh hàng ngày (Streak ngày ${user.streak})`,
                points: streakBonus,
                timestamp: new Date().toISOString()
            });
        }
    }
    // Clear OTP
    delete db.otps[email];
    writeDb(db);
    // Simple token simulation
    const token = `token-${Buffer.from(email).toString("base64")}-${Date.now()}`;
    return res.json({
        message: "Đăng nhập thành công!",
        token,
        user: db.users[email]
    });
});
// GET user profile
app.get("/api/user/:email", (req, res) => {
    const { email } = req.params;
    const db = readDb();
    const user = db.users[email] || { email, points: 0, streak: 1 };
    res.json(user);
});
// GET all data for the application dashboard
app.get("/api/data", (req, res) => {
    const db = readDb();
    res.json({
        subjects: db.subjects || [],
        sessions: db.sessions || [],
        screenTime: db.screenTime || [],
        appLimits: db.appLimits || [],
        pointLogs: db.pointLogs || []
    });
});
// Subjects CRUD
app.post("/api/subjects", (req, res) => {
    const { id, name, color, targetHours } = req.body;
    const db = readDb();
    if (!db.subjects)
        db.subjects = [];
    if (id) {
        // Edit
        const index = db.subjects.findIndex((s) => s.id === id);
        if (index !== -1) {
            db.subjects[index] = { id, name, color, targetHours: Number(targetHours) };
        }
    }
    else {
        // Add
        const newSubject = {
            id: `sub-${Date.now()}`,
            name,
            color,
            targetHours: Number(targetHours)
        };
        db.subjects.push(newSubject);
    }
    writeDb(db);
    res.json({ success: true, subjects: db.subjects });
});
app.delete("/api/subjects/:id", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.subjects = db.subjects.filter((s) => s.id !== id);
    // Also clean up sessions belonging to deleted subject
    db.sessions = db.sessions.filter((s) => s.subjectId !== id);
    writeDb(db);
    res.json({ success: true, subjects: db.subjects, sessions: db.sessions });
});
// Sessions CRUD
app.post("/api/sessions", (req, res) => {
    const { id, subjectId, title, startTime, endTime, location, notes, status, syncedToGoogle } = req.body;
    const db = readDb();
    if (!db.sessions)
        db.sessions = [];
    const sessionObj = {
        id: id || `sess-${Date.now()}`,
        subjectId,
        title,
        startTime,
        endTime,
        location: location || "",
        notes: notes || "",
        status: status || "planned",
        syncedToGoogle: !!syncedToGoogle
    };
    if (id) {
        const index = db.sessions.findIndex((s) => s.id === id);
        if (index !== -1) {
            // Check if status changed to done
            const oldSession = db.sessions[index];
            if (oldSession.status !== "done" && sessionObj.status === "done") {
                // Award gamified points for completing session!
                const userEmail = req.headers["x-user-email"] || "dd0369797@gmail.com";
                if (db.users[userEmail]) {
                    db.users[userEmail].points += 50;
                }
                db.pointLogs.push({
                    id: `pl-${Date.now()}`,
                    reason: `Hoàn thành lịch học: ${sessionObj.title}`,
                    points: 50,
                    timestamp: new Date().toISOString()
                });
            }
            db.sessions[index] = sessionObj;
        }
    }
    else {
        db.sessions.push(sessionObj);
    }
    writeDb(db);
    res.json({ success: true, sessions: db.sessions, pointLogs: db.pointLogs, users: db.users });
});
app.delete("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.sessions = db.sessions.filter((s) => s.id !== id);
    writeDb(db);
    res.json({ success: true, sessions: db.sessions });
});
// Sync Sessions - Google Calendar Sync Mock/Actual trigger
app.post("/api/sessions/sync", (req, res) => {
    const { ids } = req.body; // Array of session ids to sync
    const db = readDb();
    let count = 0;
    db.sessions = db.sessions.map((s) => {
        if (ids.includes(s.id)) {
            s.syncedToGoogle = true;
            count++;
        }
        return s;
    });
    writeDb(db);
    res.json({ success: true, message: `Đồng bộ thành công ${count} sự kiện lên Google Calendar!`, sessions: db.sessions });
});
// ScreenTime CRUD
app.post("/api/screentime", (req, res) => {
    const { appName, minutes } = req.body;
    const db = readDb();
    if (!db.screenTime)
        db.screenTime = [];
    const todayStr = new Date().toISOString().split("T")[0];
    // See if there's already an entry for this app today, if so we add to it
    const existingIndex = db.screenTime.findIndex((st) => st.appName.toLowerCase() === appName.toLowerCase() && st.date === todayStr);
    if (existingIndex !== -1) {
        db.screenTime[existingIndex].minutes += Number(minutes);
    }
    else {
        db.screenTime.push({
            id: `st-${Date.now()}`,
            appName,
            minutes: Number(minutes),
            date: todayStr
        });
    }
    writeDb(db);
    res.json({ success: true, screenTime: db.screenTime });
});
app.delete("/api/screentime/:id", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.screenTime = db.screenTime.filter((st) => st.id !== id);
    writeDb(db);
    res.json({ success: true, screenTime: db.screenTime });
});
// Limits CRUD
app.post("/api/limits", (req, res) => {
    const { id, appName, limitMinutes } = req.body;
    const db = readDb();
    if (!db.appLimits)
        db.appLimits = [];
    if (id) {
        const index = db.appLimits.findIndex((l) => l.id === id);
        if (index !== -1) {
            db.appLimits[index] = { id, appName, limitMinutes: Number(limitMinutes) };
        }
    }
    else {
        db.appLimits.push({
            id: `lim-${Date.now()}`,
            appName,
            limitMinutes: Number(limitMinutes)
        });
    }
    writeDb(db);
    res.json({ success: true, appLimits: db.appLimits });
});
app.delete("/api/limits/:id", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.appLimits = db.appLimits.filter((l) => l.id !== id);
    writeDb(db);
    res.json({ success: true, appLimits: db.appLimits });
});
// Add Points
app.post("/api/points", (req, res) => {
    const { email, points, reason } = req.body;
    const db = readDb();
    const userEmail = email || "dd0369797@gmail.com";
    if (!db.users[userEmail]) {
        db.users[userEmail] = { email: userEmail, points: 0, streak: 1 };
    }
    db.users[userEmail].points += Number(points);
    db.pointLogs.push({
        id: `pl-${Date.now()}`,
        reason,
        points: Number(points),
        timestamp: new Date().toISOString()
    });
    writeDb(db);
    res.json({ success: true, user: db.users[userEmail], pointLogs: db.pointLogs });
});
// ================= AI Assistant Chat Route with Gemini =================
app.post("/api/gemini/chat", async (req, res) => {
    const { messages, userEmail } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Tham số hội thoại không hợp lệ" });
    }
    const userMsg = messages[messages.length - 1];
    const query = userMsg ? userMsg.text : "";
    // Dynamic status/context extraction from database for Smart ground answers!
    const db = readDb();
    const subjectsList = db.subjects || [];
    const sessionsList = db.sessions || [];
    const screenTimeList = db.screenTime || [];
    const appLimitsList = db.appLimits || [];
    const pointLogsList = db.pointLogs || [];
    const userProfile = db.users[userEmail || "dd0369797@gmail.com"] || { email: "Sinh viên CTUMP", points: 0, streak: 1 };
    // Generate system prompt
    const systemInstruction = `Bạn là Trợ lý học tập thông minh MedMate, được phát triển dành riêng cho sinh viên Đại học Y Dược Cần Thơ (CTUMP). 
Bạn thông minh, hiểu sâu sắc về lộ trình học tập ngành Y (Y khoa, Dược học, Răng Hàm Mặt, Y học dự phòng, Điều dưỡng, v.v.).
Hãy trả lời thân thiện, hữu ích, chuyên nghiệp bằng tiếng Việt. Luôn động viên tinh thần học tập vất vả của sinh viên ngành Y.

Dữ liệu hiện tại của sinh viên này để bạn hỗ trợ tham chiếu (Hãy dùng thông tin này để cá nhân hóa câu trả lời khi họ hỏi về lịch học, tiến độ):
- Email sinh viên: ${userProfile.email}
- Điểm thưởng tích lũy: ${userProfile.points} Điểm (XP)
- Chuỗi học tập (Streak): ${userProfile.streak} ngày liên tục
- Danh sách môn học đang quản lý: ${JSON.stringify(subjectsList.map(s => `${s.name} (Mục tiêu: ${s.targetHours}h/tuần)`))}
- Lịch học hiện tại: ${JSON.stringify(sessionsList.map(s => `Môn: ${s.title}, Thời gian: ${s.startTime} đến ${s.endTime}, Địa điểm: ${s.location}, Ghi chú: ${s.notes}, Trạng thái: ${s.status === 'done' ? 'Hoàn thành' : 'Đang lên lịch'}`))}
- Thời gian sử dụng thiết bị hôm nay: ${JSON.stringify(screenTimeList.map(st => `${st.appName}: ${st.minutes} phút`))}
- Giới hạn ứng dụng đã cài đặt: ${JSON.stringify(appLimitsList.map(l => `${l.appName}: Giới hạn ${l.limitMinutes} phút`))}

Khi sinh viên hỏi:
- "Hôm nay học gì?": Hãy phân tích danh sách "Lịch học hiện tại" ở trên, liệt kê các ca học trong ngày hôm nay hoặc ngày mai, chỉ ra môn học, địa điểm, ghi chú và chúc họ học tốt.
- "Pomodoro là gì?": Giải thích phương pháp quả cà chua huyền thoại, hướng dẫn cách học 25 phút, nghỉ 5 phút hoặc 50 phút nghỉ 10 phút ứng dụng trong học Y khoa (học thuộc từ vựng, giải phẫu, cơ chế dược lý).
- Gợi ý phân bổ thời gian: Nếu thấy thời gian lướt TikTok, Facebook vượt hạn hoặc quá nhiều so với giờ học môn Y, hãy nhẹ nhàng nhắc nhở và đề xuất học Pomodoro để cân bằng lại!

Hãy viết câu trả lời ngắn gọn, rành mạch, có chia các gạch đầu dòng rõ ràng, tuyệt đối không viết một khối văn bản dài dằng dặc.`;
    const client = getGeminiClient();
    if (!client) {
        // Elegant fallback simulation if Gemini key is not configured yet
        console.log("[AI] API key not found. Providing rule-based simulated response.");
        let fallbackText = "";
        const cleanQuery = query.toLowerCase();
        if (cleanQuery.includes("hôm nay học gì") || cleanQuery.includes("lich hoc") || cleanQuery.includes("học gì")) {
            const todaySessions = sessionsList.filter((s) => s.startTime.startsWith(new Date().toISOString().split("T")[0]));
            if (todaySessions.length === 0) {
                fallbackText = `Chào bạn! Hôm nay bạn không có lịch học nào được lên kế hoạch trên hệ thống. 
        \n\nBạn có thể vào mục **Lịch học** để lên lịch tự học hoặc ôn tập thêm các môn học cực kỳ quan trọng như **Giải phẫu học II** hoặc **Dược lý học lâm sàng** nhé! Chúc bạn một ngày học tập tràn đầy năng lượng! 💪`;
            }
            else {
                fallbackText = `Chào bạn! Dưới đây là lịch học của bạn trong ngày hôm nay:
        ${todaySessions.map((s, idx) => `\n${idx + 1}. **${s.title}**
        - Giờ học: ${s.startTime.split("T")[1].substring(0, 5)} - ${s.endTime.split("T")[1].substring(0, 5)}
        - Địa điểm: ${s.location || "Chưa thiết lập"}
        - Trạng thái: ${s.status === "done" ? "✅ Đã xong" : "🕒 Chưa hoàn thành"}`).join("")}
        \n\nHãy cố gắng hoàn thành lịch trình và bấm **Hoàn thành** để nhận ngay **50 điểm thưởng (XP)** từ MedMate CTUMP nhé!`;
            }
        }
        else if (cleanQuery.includes("pomodoro") || cleanQuery.includes("cà chua") || cleanQuery.includes("quả cà chua")) {
            fallbackText = `**Phương pháp Pomodoro (Quả cà chua)** là vị cứu tinh cho sinh viên Y Dược CTUMP để ghi nhớ khối lượng kiến thức khổng lồ:
      \n\n1. **Cách thực hiện:**
      - Bước 1: Chọn một môn học cần học (ví dụ: Học 50 cấu trúc giải phẫu).
      - Bước 2: Bật Timer Pomodoro 25 phút (hoặc 50 phút).
      - Bước 3: Tập trung 100% học không sao nhãng cho tới khi chuông reo.
      - Bước 4: Nghỉ ngơi hoàn toàn trong 5 phút (đi uống nước, vươn vai).
      - Bước 5: Lặp lại. Sau 4 chu kỳ Pomodoro, nghỉ dài hơn (15-30 phút).
      \n2. **Lời khuyên MedMate:** Học Y Dược đòi hỏi tập trung cao độ, hãy tắt hoàn toàn các tab Facebook/TikTok khi bắt đầu Pomodoro để bảo vệ tế bào thần kinh của bạn!`;
        }
        else {
            fallbackText = `Chào bạn! Tôi là trợ lý học tập MedMate CTUMP. Cảm ơn câu hỏi của bạn: "${query}".
      \nDo hệ thống đang chạy thử nghiệm trực tiếp, tôi khuyên bạn nên:
      - Đảm bảo bạn đã nhập **mục tiêu giờ học** cho từng môn học trong phần **Môn học**.
      - Đăng nhập bằng tài khoản email để kích hoạt chuỗi **Streak điểm danh ngày**.
      - Sử dụng bộ đếm **Pomodoro** tích hợp của MedMate để tăng tối đa khả năng tập trung nhớ bài thuốc hoặc giải phẫu xương.
      \nNếu bạn có thắc mắc gì về học tập lâm sàng hay lý thuyết, cứ nhắn cho tôi nhé! Chúc bạn học tốt! 🩺🎓`;
        }
        return res.json({ text: fallbackText });
    }
    // Real Gemini call
    try {
        const formattedHistory = messages.slice(0, -1).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.text }],
        }));
        // Add current query
        formattedHistory.push({
            role: "user",
            parts: [{ text: query }],
        });
        const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        return res.json({ text: response.text });
    }
    catch (err) {
        console.error("Gemini API Error:", err);
        return res.status(500).json({ error: "Lỗi kết nối trí tuệ nhân tạo Gemini. Vui lòng thử lại sau.", details: err.message });
    }
});
// Serve Vite build outputs in production, mount Vite development middleware in dev
const startServer = async () => {
    if (process.env.NODE_ENV !== "production") {
        const vite = await (0, vite_1.createServer)({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path_1.default.join(process.cwd(), "dist");
        app.use(express_1.default.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path_1.default.join(distPath, "index.html"));
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
};
startServer();
