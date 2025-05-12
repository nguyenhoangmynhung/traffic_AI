
// Khởi tạo Firebase
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
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendQuestion();
    });
    backButton.addEventListener("click", () => window.location.href = "index.html");
    voiceButton.addEventListener("click", startListening);
    if (viewHistoryBtn) viewHistoryBtn.addEventListener("click", hienThiLichSuChat);
});

async function sendQuestion() {
    const inputField = document.getElementById("questionInput");
    const responseContainer = document.getElementById("chatbotResponse");

    let ma = inputField.value.trim().toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
    if (ma === "") {
        alert("⚠️ Vui lòng nhập hoặc nói mã biển báo!");
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
            traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
            const content = \`
                ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
                📘 <strong>Tên:</strong> ${data.TenBien}<br>
                📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
                💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
                📌 <strong>Loại biển:</strong> ${data.TenLoai}<br>
            \`;
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
            console.log("✅ Đã lưu lịch sử");
        }
    } catch (err) {
        console.error("❌ Lỗi tìm dữ liệu:", err);
        responseContainer.innerHTML = "❌ Không thể truy vấn dữ liệu!";
    }
}

function speakText(text) {
    let speech = new SpeechSynthesisUtterance(text);
    let voices = window.speechSynthesis.getVoices();
    let viVoice = voices.find(v => v.lang === "vi-VN" || v.name.includes("Vietnamese"));
    if (viVoice) speech.voice = viVoice;
    speech.lang = "vi-VN";
    speech.volume = 1;
    speech.rate = 0.95;
    window.speechSynthesis.speak(speech);
}

function startListening() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        alert("❌ Trình duyệt không hỗ trợ nhận diện giọng nói.");
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;

    recognition.onstart = () => {
        document.getElementById("chatbotResponse").innerHTML = "🎤 Đang nghe...";
        voiceButton.innerText = "⏳ Đang nghe...";
        voiceButton.disabled = true;
    };

    recognition.onresult = event => {
        const transcript = event.results[0][0].transcript.trim();
        document.getElementById("questionInput").value = transcript;
        sendQuestion();
        voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
        voiceButton.disabled = false;
    };

    recognition.onerror = event => {
        console.error("Lỗi giọng nói:", event.error);
        voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
        voiceButton.disabled = false;
        document.getElementById("chatbotResponse").innerHTML = "❌ Lỗi nhận diện giọng nói!";
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
            .limit(10)
            .get();

        if (snapshot.empty) {
            container.innerHTML = "<p>📭 Chưa có lịch sử hỏi đáp.</p>";
            return;
        }

        let html = "<h3>📜 Lịch sử hỏi đáp</h3><ul>";
        snapshot.forEach(doc => {
            const data = doc.data();
            html += \`
                <li style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
                    🕒 ${new Date(data.ThoiGian).toLocaleString()}<br>
                    ❓ <strong>Hỏi:</strong> ${data.CauHoi}<br>
                    💬 <strong>Đáp:</strong> ${data.TraLoi}
                </li>
            \`;
        });
        html += "</ul>";
        container.innerHTML = html;
    } catch (err) {
        console.error("❌ Lỗi lấy lịch sử:", err);
        container.innerHTML = "<p>❌ Không lấy được lịch sử!</p>";
    }
}

