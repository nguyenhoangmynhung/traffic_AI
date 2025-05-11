document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("questionInput");
    const sendButton = document.getElementById("sendButton");
    const responseContainer = document.getElementById("chatbotResponse");
    const backButton = document.getElementById("backButton");
    const voiceButton = document.getElementById("voiceButton");
    const viewHistoryBtn = document.getElementById("viewHistoryBtn"); // ✅ nút xem lịch sử

    if (!inputField || !sendButton || !responseContainer || !backButton || !voiceButton) {
        console.error("❌ Lỗi: Không tìm thấy phần tử HTML cần thiết!");
        return;
    }

    sendButton.addEventListener("click", sendQuestion);
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendQuestion();
        }
    });

    backButton.addEventListener("click", function () {
        window.location.href = "index.html";
    });

    voiceButton.addEventListener("click", startListening);

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener("click", hienThiLichSuChat);
    }
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
            console.log("📦 Dữ liệu nhận được từ server:", data);

            const maND = parseInt(localStorage.getItem("maND"));
            console.log("🧾 maND:", maND);
            let traLoi = "";

            if (data.error) {
                traLoi = data.error;
                responseContainer.innerHTML = `❌ ${data.error}`;
                speakText(data.error);
            } else {
                traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
                const content = `
                    ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
                    📘 <strong>Tên:</strong> ${data.TenBien}<br>
                    📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
                    💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
                    📌 <strong>Loại biển:</strong> ${data.TenLoai}<br>
                   `;
                responseContainer.innerHTML = content;
                speakText(traLoi);
            }

            if (maND) {
                fetch("http://127.0.0.1:3000/api/luu-chatlog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        maND,
                        cauHoi: ma,
                        cauTraLoi: traLoi
                    })
                })
                    .then(res => res.json())
                    .then(data => console.log("💾 Đã lưu lịch sử:", data))
                    .catch(err => console.error("❌ Không lưu được lịch sử:", err));
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

    if (vietnameseVoice) {
        speech.voice = vietnameseVoice;
    }

    speech.lang = "vi-VN";
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1.0;

    window.speechSynthesis.speak(speech);
}

function startListening() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        alert("❌ Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
        document.getElementById("chatbotResponse").innerHTML = "🎤 Đang nghe... Hãy nói tên biển báo!";
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
        console.error("🎤 Lỗi nhận diện giọng nói:", event.error);
        const responseContainer = document.getElementById("chatbotResponse");
        let responseMessage = "❌ Lỗi nhận diện giọng nói, hãy thử lại!";

        switch (event.error) {
            case "not-allowed":
                responseMessage = "⚠ Bạn chưa cấp quyền truy cập microphone!";
                break;
            case "network":
                responseMessage = "⚠ Lỗi kết nối mạng!";
                break;
            case "no-speech":
                responseMessage = "⚠ Không nhận diện được giọng nói!";
                break;
            case "aborted":
                responseMessage = "⚠ Hệ thống nhận diện bị hủy.";
                break;
            case "audio-capture":
                responseMessage = "⚠ Không tìm thấy microphone!";
                break;
            default:
                responseMessage = "⚠ Đã xảy ra lỗi không xác định.";
                break;
        }

        responseContainer.innerHTML = responseMessage;
        voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
        voiceButton.disabled = false;
    };

    recognition.start();
}

// ✅ THÊM PHẦN XEM LỊCH SỬ CHAT
async function hienThiLichSuChat() {
    const container = document.getElementById("chatHistoryContainer");
    const maND = localStorage.getItem("maND");
    if (!maND) {
        container.innerHTML = "<p>⚠️ Bạn cần đăng nhập để xem lịch sử.</p>";
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/chatlog/${maND}`);
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = "<p>📭 Chưa có lịch sử hỏi đáp.</p>";
            return;
        }

        let html = "<h3>📜 Lịch sử hỏi đáp</h3><ul>";
        data.forEach(log => {
            html += `
                <li style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
                    🕒 ${new Date(log.ThoiGian).toLocaleString()}<br>
                    ❓ <strong>Hỏi:</strong> ${log.CauHoi}<br>
                    💬 <strong>Đáp:</strong> ${log.TraLoi}
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