// ✅ KHÔNG khai báo lại firebaseConfig ở đây (đã có trong HTML)
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
        if (event.key === "Enter") {
            sendQuestion();
        }
    });

    backButton.addEventListener("click", () => window.location.href = "index.html");

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

    db.collection("BienBao").where("MaBien", "==", ma).limit(1).get()
        .then(snapshot => {
            if (snapshot.empty) {
                const errorMsg = `Không tìm thấy biển báo "${ma}" trong cơ sở dữ liệu.`;
                responseContainer.innerHTML = `❌ ${errorMsg}`;
                speakText(errorMsg);
                luuChat(ma, errorMsg);
                return;
            }

            const data = snapshot.docs[0].data();
            const traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
            const content = `
                ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
                📘 <strong>Tên:</strong> ${data.TenBien}<br>
                📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
                💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
                📌 <strong>Loại biển:</strong> ${data.TenLoai}<br>
            `;
            responseContainer.innerHTML = content;
            speakText(traLoi);
            luuChat(ma, traLoi);
        })
        .catch(err => {
            console.error("❌ Lỗi truy vấn Firestore:", err);
            responseContainer.innerHTML = "❌ Lỗi khi tìm kiếm dữ liệu!";
        });
}

function speakText(text) {
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang === "vi-VN" || v.name.includes("Vietnamese"));
    if (viVoice) speech.voice = viVoice;

    speech.lang = "vi-VN";
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
}

function startListening() {
    const voiceButton = document.getElementById("voiceButton");
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";

    recognition.onstart = () => {
        document.getElementById("chatbotResponse").innerHTML = "🎤 Đang nghe... Hãy nói tên biển báo!";
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
        const responseContainer = document.getElementById("chatbotResponse");
        responseContainer.innerHTML = "❌ Lỗi nhận diện giọng nói!";
        voiceButton.innerText = "🎤 Hỏi bằng giọng nói";
        voiceButton.disabled = false;
        console.error("🎤 Voice error:", event.error);
    };

    recognition.start();
}

function luuChat(cauHoi, traLoi) {
    const maND = localStorage.getItem("maND");
    if (!maND) return;

    db.collection("ChatLog").add({
        MaNguoiDung: maND,
        CauHoi: cauHoi,
        TraLoi: traLoi,
        ThoiGian: new Date().toISOString()
    }).then(() => {
        console.log("✅ Đã lưu chat.");
    }).catch(err => {
        console.error("❌ Không lưu được chat:", err);
    });
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
            .where("MaNguoiDung", "==", maND)
            .orderBy("ThoiGian", "desc")
            .limit(10)
            .get();

        if (snapshot.empty) {
            container.innerHTML = "<p>📭 Chưa có lịch sử hỏi đáp.</p>";
            return;
        }

        let html = "<h3>📜 Lịch sử hỏi đáp</h3><ul>";
        snapshot.forEach(doc => {
            const log = doc.data();
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
