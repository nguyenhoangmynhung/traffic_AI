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

  async function sendQuestion() {
  const rawInput = inputField.value.trim();
  if (!rawInput) return alert("⚠️ Vui lòng nhập nội dung cần hỏi!");

  responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";
  const maND = localStorage.getItem("maND");
  const queryText = rawInput.toUpperCase().normalize("NFC");
  let traLoi = "";

  try {
    // 👉 Tìm mã biển trong câu hỏi (vd: "Biển báo R305 có ý nghĩa gì")
    const maMatch = queryText.match(/[A-Z]\d{2,3}[A-Z]?/);  // VD: R305, P112A
    const maFromInput = maMatch ? maMatch[0] : "";

    let snapshot = null;

    // 1. Nếu có mã biển trong câu, ưu tiên tìm theo mã
    if (maFromInput) {
      snapshot = await db.collection("BienBao")
        .where("MaBien", "==", maFromInput)
        .limit(1)
        .get();
    }

    // 2. Nếu không tìm được, hoặc không có mã, tìm theo tên gần đúng
    if (!snapshot || snapshot.empty) {
      const allDocs = await db.collection("BienBao").get();
      const matchedDoc = allDocs.docs.find(doc => {
        const ten = doc.data().TenBien?.toUpperCase().normalize("NFC");
        return ten && queryText.includes(ten);
      });

      if (matchedDoc) {
        snapshot = { empty: false, docs: [matchedDoc] };
      }
    }

    // 3. Nếu vẫn không có thì báo lỗi
    if (!snapshot || snapshot.empty) {
      traLoi = `Không tìm thấy mã hoặc tên biển báo: ${rawInput}`;
      responseContainer.innerHTML = `❌ ${traLoi}`;
      speakText(traLoi);
      return;
    }

    // 4. Lấy dữ liệu & tìm loại biển
    const data = snapshot.docs[0].data();
    let tenLoai = "Chưa xác định";

    if (data.MaLoai) {
      const loaiRef = await db.collection("LoaiBien").doc(data.MaLoai).get();
      if (loaiRef.exists) {
        tenLoai = loaiRef.data().TenLoai || "Chưa xác định";
      }
    }

    traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
    const html = `
      ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
      📘 <strong>Tên:</strong> ${data.TenBien}<br>
      📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
      💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
      📌 <strong>Loại biển:</strong> ${tenLoai}<br>`;
    responseContainer.innerHTML = html;
    speakText(traLoi);

    // 5. Lưu lịch sử nếu có người dùng
    if (maND) {
      await db.collection("ChatLog").add({
        MaND: maND,
        CauHoi: rawInput,
        TraLoi: traLoi,
        ThoiGian: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error("❌ Lỗi xử lý:", err);
    responseContainer.innerHTML = "❌ Lỗi kết nối hoặc xử lý dữ liệu!";
  }
}
  function speakText(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "vi-VN";
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  }

  function startListening() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      inputField.value = transcript;
      sendQuestion();
    };
    recognition.onerror = () => responseContainer.innerHTML = "❌ Lỗi nhận diện giọng nói!";
    recognition.start();
  }

  async function hienThiLichSuChat() {
    const container = document.getElementById("chatHistoryContainer");
    const maND = localStorage.getItem("maND");
    if (!maND) return container.innerHTML = "⚠️ Cần đăng nhập để xem lịch sử.";

    try {
      const snapshot = await db.collection("ChatLog")
        .where("MaND", "==", maND)
        .orderBy("ThoiGian", "desc")
        .limit(10).get();

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
