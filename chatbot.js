// Khởi tạo Firebase (compat CDN)
const firebaseConfig = {
  apiKey: "AIzaSyBGzcRnvcrfSaejw_FPQZdmgbC76nX_XEo",
  authDomain: "trafficai-2a2d6.firebaseapp.com",
  projectId: "trafficai-2a2d6",
  storageBucket: "trafficai-2a2d6.appspot.com",
  messagingSenderId: "29599829580",
  appId: "1:29599829580:web:4537c5749320276e88eee9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("questionInput");
  const sendButton = document.getElementById("sendButton");
  const responseContainer = document.getElementById("chatbotResponse");
  const backButton = document.getElementById("backButton");
  const voiceButton = document.getElementById("voiceButton");
  const viewHistoryBtn = document.getElementById("viewHistoryBtn");

  sendButton.addEventListener("click", sendQuestion);
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendQuestion();
  });
  backButton.addEventListener("click", () => location.href = "index.html");
  voiceButton.addEventListener("click", startListening);
  if (viewHistoryBtn) viewHistoryBtn.addEventListener("click", hienThiLichSuChat);
});

async function sendQuestion() {
  const input = document.getElementById("questionInput");
  const ma = input.value.trim().toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
  const responseContainer = document.getElementById("chatbotResponse");

  if (!ma) {
    alert("⚠️ Vui lòng nhập mã biển báo");
    return;
  }

  responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";

  try {
    const snapshot = await db.collection("BienBao").where("MaBien", "==", ma).limit(1).get();
    const maND = localStorage.getItem("maND");
    let traLoi = "";

    if (snapshot.empty) {
      traLoi = `Không tìm thấy mã biển báo ${ma}`;
      responseContainer.innerHTML = `❌ ${traLoi}`;
      speakText(traLoi);
    } else {
      const data = snapshot.docs[0].data();
      traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || "không có quy định."}`;
      const content = `
        ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
        📘 <strong>Tên:</strong> ${data.TenBien}<br>
        📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
        💸 <strong>Mức phạt:</strong> ${data.MucPhat || "không có quy định"}<br>
        ❗ <strong>Loại biển:</strong> ${data.TenLoai || "không rõ"}<br>
      `;
      responseContainer.innerHTML = content;
      speakText(traLoi);
    }

    if (maND) {
      await db.collection("ChatLog").add({
        MaND: maND,
        CauHoi: ma,
        TraLoi: traLoi,
        ThoiGian: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error("❌ Lỗi API:", err);
    document.getElementById("chatbotResponse").innerHTML = "❌ Lỗi kết nối hoặc cú pháp!";
  }
}

function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find(v => v.lang === "vi-VN");
  if (viVoice) speech.voice = viVoice;
  speech.lang = "vi-VN";
  speech.rate = 0.95;
  window.speechSynthesis.speak(speech);
}

function startListening() {
  const voiceButton = document.getElementById("voiceButton");
  const responseContainer = document.getElementById("chatbotResponse");

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    alert("Trình duyệt không hỗ trợ voice!");
    return;
  }

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "vi-VN";
  recognition.onstart = () => {
    responseContainer.innerHTML = "🎤 Đang nghe...";
    voiceButton.innerText = "⏳ Đang nghe...";
    voiceButton.disabled = true;
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("questionInput").value = transcript;
    voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
    voiceButton.disabled = false;
    sendQuestion();
  };

  recognition.onerror = () => {
    responseContainer.innerHTML = "⚠️ Không nhận diện được!";
    voiceButton.disabled = false;
    voiceButton.innerText = "🎤 Hỏi lại";
  };

  recognition.start();
}

async function hienThiLichSuChat() {
  const container = document.getElementById("chatHistoryContainer");
  const maND = localStorage.getItem("maND");

  if (!maND) {
    container.innerHTML = "<p>⚠️ Bạn cần đăng nhập để xem lịch sử.</p>";
    return;
  }

  try {
    const snapshot = await db.collection("ChatLog")
      .where("MaND", "==", maND)
      .orderBy("ThoiGian", "desc")
      .limit(5)
      .get();

    if (snapshot.empty) {
      container.innerHTML = "<p>📭 Chưa có lịch sử hỏi đáp.</p>";
      return;
    }

    let html = "<h3>📜 Lịch sử hỏi đáp</h3><ul>";
    snapshot.forEach(doc => {
      const d = doc.data();
      html += `
        <li style="margin-bottom:10px;">
          🕒 ${new Date(d.ThoiGian).toLocaleString()}<br>
          ❓ <strong>Hỏi:</strong> ${d.CauHoi}<br>
          💬 <strong>Đáp:</strong> ${d.TraLoi}
        </li>
      `;
    });
    html += "</ul>";
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = "<p>❌ Lỗi khi tải lịch sử!</p>";
  }
}
