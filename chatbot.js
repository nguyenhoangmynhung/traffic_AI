// Khởi tạo Firebase (nếu chưa có)
const firebaseConfig = {
  apiKey: "AIzaSyBGzcRnvcrfSaejw_FPQZdmgbC76nX_XEo",
  authDomain: "trafficai-2a2d6.firebaseapp.com",
  projectId: "trafficai-2a2d6",
  storageBucket: "trafficai-2a2d6.appspot.com",
  messagingSenderId: "29599829580",
  appId: "1:29599829580:web:4537c5749320276e88eee9"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("questionInput");
  const sendButton = document.getElementById("sendButton");
  const responseContainer = document.getElementById("chatbotResponse");
  const backButton = document.getElementById("backButton");
  const voiceButton = document.getElementById("voiceButton");
  const viewHistoryBtn = document.getElementById("viewHistoryBtn");

  sendButton?.addEventListener("click", sendQuestion);
  inputField?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendQuestion();
  });
  backButton?.addEventListener("click", () => location.href = "index.html");
  voiceButton?.addEventListener("click", startListening);
  viewHistoryBtn?.addEventListener("click", hienThiLichSuChat);

  // Sự kiện cho nút chuyển chế độ "Trợ lý AI"
  document.getElementById("aiButton")?.addEventListener("click", () => {
    mode = "ai"; // Chuyển sang chế độ trợ lý AI
    switchMode(); // Chuyển giao diện
  });

  // Chức năng chuyển chế độ
  let mode = "bienbao"; // Mặc định là chế độ Học biển báo

  // Hàm chuyển chế độ
  function switchMode() {
    const chatContainer = document.getElementById("chatContainer");
    if (mode === "bienbao") {
      chatContainer.innerHTML = `
        <h3>Nhập hoặc nói mã biển báo/ tên biển báo:</h3>
        <input type="text" id="questionInput" placeholder="Nhập mã biển báo..." />
        <button id="sendButton">Gửi</button>
        <button id="voiceButton">🎤 Hỏi bằng giọng nói</button>
        <div id="chatbotResponse" class="info-box"></div>
      `;
    } else if (mode === "ai") {
      chatContainer.innerHTML = `
        <h3>Nhập câu hỏi cho Trợ lý AI:</h3>
        <input type="text" id="questionInputAI" placeholder="Nhập câu hỏi cho AI..." />
        <button id="sendButtonAI">Gửi</button>
        <button id="voiceButtonAI">🎤 Hỏi bằng giọng nói</button>
        <div id="chatbotResponseAI" class="info-box"></div>
      `;
    }
  }

  // Hàm gửi câu hỏi cho biển báo
  async function sendQuestion() {
    const rawText = inputField.value.trim();
    if (!rawText) return alert("⚠️ Vui lòng nhập mã hoặc tên biển báo!");

    responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";
    const queryText = rawText.toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
    const maND = localStorage.getItem("maND");
    let traLoi = "";

    try {
      let snapshot = await db.collection("BienBao")
        .where("MaBien", "==", queryText)
        .limit(1)
        .get();

      if (snapshot.empty) {
        const allDocs = await db.collection("BienBao").get();
        const matched = allDocs.docs.find(doc => {
          const data = doc.data();
          return rawText.toUpperCase().includes(data.MaBien.toUpperCase()) ||
                 data.TenBien?.toUpperCase().includes(rawText.toUpperCase());
        });
        if (matched) snapshot = { empty: false, docs: [matched] };
      }

      if (snapshot.empty) {
        traLoi = `Không tìm thấy mã hoặc tên biển báo: ${rawText}`;
        responseContainer.innerHTML = `❌ ${traLoi}`;
        speakText(traLoi);
        return;
      }

      const data = snapshot.docs[0].data();
      const hinh = data.HinhAnh ? 
        `<img src="https://nguyenhoangmynhung.github.io/traffic_AI${data.HinhAnh}" alt="Biển báo" style="max-width:120px; max-height:120px; display:block; margin-bottom:8px;" />` 
        : "";

      let tenLoai = "Chưa xác định";
      if (data.MaLoai) {
        try {
          const loaiSnap = await db.collection("LoaiBien").doc(data.MaLoai).get();
          if (loaiSnap.exists) tenLoai = loaiSnap.data().TenLoai || "Chưa xác định";
        } catch (e) {
          console.warn("Không lấy được tên loại biển:", e);
        }
      }

      traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
      const html = `
        <div style="display:flex; gap:20px; align-items:flex-start;">
          ${hinh}
          <div>
            <h4>⚠️ <strong>Biển báo ${data.MaBien}</strong></h4>
            <p>📘 <strong>Tên:</strong> ${data.TenBien}</p>
            <p>📝 <strong>Mô tả:</strong> ${data.MoTa}</p>
            <p>💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}</p>
            <p>📌 <strong>Loại biển:</strong> ${tenLoai}</p>
          </div>
        </div>`;

      responseContainer.innerHTML = html;
      speakText(traLoi);

      if (maND) {
        await db.collection("ChatLog").add({
          MaND: maND,
          CauHoi: rawText,
          TraLoi: traLoi,
          ThoiGian: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("❌ Lỗi tìm kiếm:", err);
      responseContainer.innerHTML = "❌ Lỗi kết nối hoặc tìm kiếm!";
    }
  }

  // Hàm nhận diện giọng nói
  function startListening() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().replace(/\.$/, "");
      inputField.value = transcript;
      sendQuestion();
    };
    recognition.onerror = () => responseContainer.innerHTML = "❌ Lỗi nhận diện giọng nói!";
    recognition.start();
  }

  // Hiển thị lịch sử chat
  async function hienThiLichSuChat() {
    const container = document.getElementById("chatHistoryContainer");
    const maND = localStorage.getItem("maND");
    if (!maND) return container.innerHTML = "⚠️ Cần đăng nhập để xem lịch sử.";

    try {
      const snapshot = await db.collection("ChatLog")
        .where("MaND", "==", maND)
        .orderBy("ThoiGian", "desc")
        .limit(10)
        .get();

      if (snapshot.empty) {
        container.innerHTML = "📭 Chưa có lịch sử hỏi đáp.";
        return;
      }

      let html = "<h3>📜 Lịch sử hỏi đáp</h3><ul>";
      snapshot.forEach(doc => {
        const log = doc.data();
        html += `
          <li style="margin-bottom: 10px;">
            🕒 ${new Date(log.ThoiGian).toLocaleString()}<br>
            ❓ <strong>Hỏi:</strong> ${log.CauHoi}<br>
            💬 <strong>Đáp:</strong> ${log.TraLoi}
          </li>`;
      });
      html += "</ul>";
      container.innerHTML = html;

    } catch (err) {
      console.error("❌ Lỗi lịch sử:", err);
      container.innerHTML = "❌ Không thể tải lịch sử!";
    }
  }
});
