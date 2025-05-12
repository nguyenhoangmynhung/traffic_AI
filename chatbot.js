
// Firebase đã được khai báo từ HTML, chỉ cần sử dụng db
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("questionInput");
    const sendButton = document.getElementById("sendButton");
    const responseContainer = document.getElementById("chatbotResponse");
    const backButton = document.getElementById("backButton");
    const voiceButton = document.getElementById("voiceButton");
    const viewHistoryBtn = document.getElementById("viewHistoryBtn");

    if (!inputField || !sendButton || !responseContainer || !backButton || !voiceButton) {
        console.error("❌ Lỗi: Không tìm thấy phần tử HTML cần thiết!");
        return;
    }

    sendButton.addEventListener("click", sendQuestion);
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendQuestion();
    });

    backButton.addEventListener("click", () => window.location.href = "index.html");
    voiceButton.addEventListener("click", startListening);
    if (viewHistoryBtn) viewHistoryBtn.addEventListener("click", hienThiLichSuChat);
});

function sendQuestion() {
    const inputField = document.getElementById("questionInput");
    const responseContainer = document.getElementById("chatbotResponse");

    let ma = inputField.value.trim().toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
    if (ma === "") {
        alert("⚠️ Vui lòng nhập hoặc nói mã biển báo!");
        return;
    }

    responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";

    fetch(`http://127.0.0.1:3000/api/bien-bao/${ma}`)
        .then(res => res.json())
        .then(data => {
            const maND = parseInt(localStorage.getItem("maND"));
            let traLoi = "";

            if (data.error) {
                traLoi = data.error;
                responseContainer.innerHTML = `❌ ${data.error}`;
                speakText(data.error);
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
                    MaND: maND,
                    CauHoi: ma,
                    TraLoi: traLoi,
                    ThoiGian: new Date().toISOString()
                }).then(() => {
                    console.log("💾 Đã lưu lịch sử chat.");
                }).catch(err => {
                    console.error("❌ Không lưu được lịch sử:", err);
                });
            }
        })
        .catch(err => {
            console.error("❌ Lỗi API:", err);
            responseContainer.innerHTML = "❌ Không thể kết nối tới máy chủ!";
        });
}

function speakText(text) {
    let speech = new SpeechSynthesisUtterance(text);
    let voices = window.speechSynthesis.getVoices();
    let vietnameseVoice = voices.find(voice => voice.lang === "vi-VN" || voice.name.includes("Google Vietnamese"));
    if (vietnameseVoice) speech.voice = vietnameseVoice;
    speech.lang = "vi-VN";
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1.0;
    window.speechSynthesis.speak(speech);
}

function startListening() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        alert("❌ Trình duyệt không hỗ trợ giọng nói.");
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
        document.getElementById("chatbotResponse").innerHTML = "🎤 Đang nghe...";
        voiceButton.innerText = "⏳ Đang nghe...";
        voiceButton.disabled = true;
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript.trim();
        document.getElementById("questionInput").value = transcript;
        sendQuestion();
        voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
        voiceButton.disabled = false;
    };

    recognition.onerror = function (event) {
        const responseContainer = document.getElementById("chatbotResponse");
        let msg = "❌ Lỗi nhận diện giọng nói";
        responseContainer.innerHTML = msg;
        voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
        voiceButton.disabled = false;
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
            .where("MaND", "==", parseInt(maND))
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
            html += `
                <li style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
                    🕒 ${new Date(data.ThoiGian).toLocaleString()}<br>
                    ❓ <strong>Hỏi:</strong> ${data.CauHoi}<br>
                    💬 <strong>Đáp:</strong> ${data.TraLoi}
                </li>
            `;
        });
        html += "</ul>";
        container.innerHTML = html;
    } catch (err) {
        console.error("❌ Lỗi lấy lịch sử:", err);
        container.innerHTML = "<p>❌ Không lấy được lịch sử!</p>";
    }
}
