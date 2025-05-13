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
  const rawText = inputField.value.trim();
  if (!rawText) return alert("⚠️ Vui lòng nhập nội dung!");

  responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";
  const maND = localStorage.getItem("maND");
  let traLoi = "";

  try {
    // 👉 Tách mã biển (nếu có) từ chuỗi người dùng nhập, ví dụ: "Biển báo R305"
    const matchedMaBien = rawText.toUpperCase().match(/[A-Z]\d{2,3}[A-Z]?/);
    const ma = matchedMaBien ? matchedMaBien[0] : "";

    let snapshot = null;

    if (ma) {
      snapshot = await db.collection("BienBao").where("MaBien", "==", ma).limit(1).get();
    }

    if (!snapshot || snapshot.empty) {
      // Nếu không có mã rõ ràng hoặc không tìm thấy mã -> tìm theo tên biển gần đúng
      const all = await db.collection("BienBao").get();
      const matched = all.docs.find(doc =>
        doc.data().TenBien?.toLowerCase().includes(rawText.toLowerCase())
      );
      if (matched) snapshot = { empty: false, docs: [matched] };
    }

    if (!snapshot || snapshot.empty) {
      traLoi = `Không tìm thấy mã hoặc tên biển báo: ${rawText}`;
      responseContainer.innerHTML = `❌ ${traLoi}`;
      speakText(traLoi);
    } else {
      const data = snapshot.docs[0].data();

      // 🔄 Lấy TenLoai từ bảng LoaiBien
      let tenLoai = "Chưa xác định";
      if (data.MaLoai) {
        const loaiSnap = await db.collection("LoaiBien").doc(data.MaLoai).get();
        if (loaiSnap.exists) {
          tenLoai = loaiSnap.data().TenLoai || "Chưa xác định";
        }
      }

      traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
     let imgTag = '';
     if (data.HinhAnh) {
        const imgUrl = `https://nguyenhoangmynhung.github.io/traffic_AI${data.HinhAnh}`;
        imgTag = `<img src="${imgUrl}" alt="Hình ảnh biển báo" 
             style="max-width:200px; display:block; margin:10px auto;" />`;
      }
      const html = `
         ${imgTag}
        ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
        📘 <strong>Tên:</strong> ${data.TenBien}<br>
        📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
        💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
        📌 <strong>Loại biển:</strong> ${tenLoai}<br>`;

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
    }
  } catch (err) {
    console.error("❌ Lỗi tìm kiếm:", err);
    responseContainer.innerHTML = "❌ Lỗi kết nối hoặc tìm kiếm!";
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

   
