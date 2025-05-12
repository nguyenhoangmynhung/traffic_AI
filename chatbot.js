// chatbot.js - Firebase compat version như quiz.js

// Firebase đã được khởi tạo trong HTML, nên không khai báo lại db ở đây

// DOM elements
const inputField = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const responseContainer = document.getElementById("chatbotResponse");
const backButton = document.getElementById("backButton");
const voiceButton = document.getElementById("voiceButton");
const viewHistoryBtn = document.getElementById("viewHistoryBtn");

// Sự kiện
sendButton.addEventListener("click", sendQuestion);
inputField.addEventListener("keypress", e => e.key === "Enter" && sendQuestion());
backButton.addEventListener("click", () => location.href = "index.html");
voiceButton.addEventListener("click", startListening);
viewHistoryBtn.addEventListener("click", hienThiLichSuChat);

// Gửi câu hỏi
function sendQuestion() {
  const ma = inputField.value.trim().toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
  if (!ma) return alert("⚠️ Vui lòng nhập hoặc nói mã biển báo!");

  responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";

  fetch(`http://127.0.0.1:3000/api/bien-bao/${ma}`)
    .then(res => res.json())
    .then(data => {
      const maND = localStorage.getItem("maND");
      let traLoi = "";

      if (data.error) {
        traLoi = data.error;
        responseContainer.innerHTML = `❌ ${data.error}`;
        speakText(traLoi);
      } else {
        traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
        responseContainer.innerHTML = `
          ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
          📘 <strong>Tên:</strong> ${data.TenBien}<br>
          📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
          💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
          📌 <strong>Loại biển:</strong> ${data.TenLoai}<br>
        `;
        speakText(traLoi);
      }

      if (maND) {
        db.collection("ChatLog").add({
          MaNguoiDung: maND,
          CauHoi: ma,
          TraLoi: traLoi,
          ThoiGian: new Date().toISOString()
        }).then(() => console.log("💾 Đã lưu chat log"))
          .catch(err => console.error("❌ Lỗi lưu chat log:", err));
      }
    })
    .catch(err => {
      console.error("❌ Lỗi API:", err);
      responseContainer.innerHTML = "❌ Không thể kết nối tới máy chủ!";
    });
}

function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "vi-VN";
  speech.volume = 1;
  speech.rate = 0.9;
  speech.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const vi = voices.find(v => v.lang === "vi-VN" || v.name.includes("Vietnamese"));
  if (vi) speech.voice = vi;
  window.speechSynthesis.speak(speech);
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ giọng nói!");

  const recog = new SpeechRecognition();
  recog.lang = "vi-VN";
  recog.onstart = () => {
    responseContainer.innerHTML = "🎤 Đang nghe... Hãy nói tên biển báo!";
    voiceButton.innerText = "⏳ Đang nghe...";
    voiceButton.disabled = true;
  };
  recog.onresult = e => {
    const text = e.results[0][0].transcript.trim();
    inputField.value = text;
    sendQuestion();
    voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
    voiceButton.disabled = false;
  };
  recog.onerror = e => {
    voiceButton.disabled = false;
    voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
    responseContainer.innerHTML = "❌ Lỗi nhận diện giọng nói.";
  };
  recog.start();
}

async function hienThiLichSuChat() {
  const maND = localStorage.getItem("maND");
  const container = document.getElementById("chatHistoryContainer");
  if (!maND) return container.innerHTML = "<p>⚠️ Bạn cần đăng nhập để xem lịch sử.</p>";

  try {
    const snapshot = await db.collection("ChatLog")
      .where("MaNguoiDung", "==", maND)
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
      html += `<li style="margin-bottom:10px;border-bottom:1px solid #ccc;padding-bottom:8px;">
        🕒 ${new Date(d.ThoiGian).toLocaleString()}<br>
        ❓ <strong>Hỏi:</strong> ${d.CauHoi}<br>
        💬 <strong>Đáp:</strong> ${d.TraLoi}</li>`;
    });
    html += "</ul>";
    container.innerHTML = html;
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử chat:", err);
    container.innerHTML = "<p>❌ Không thể tải lịch sử!</p>";
  }
}
