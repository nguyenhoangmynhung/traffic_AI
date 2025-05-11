let questions = [];
let currentIndex = 0;
let score = 0;
let startTime;

const quizContainer = document.getElementById('quizContainer');
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('startQuiz');
const backBtn = document.getElementById('backButton');

startBtn.addEventListener('click', startQuiz);
backBtn.addEventListener('click', () => location.href = 'index.html');

async function startQuiz() {
    try {
        const res = await fetch('http://localhost:3000/api/cau-hoi');
        const data = await res.json();
        questions = shuffleArray(data).slice(0, 20);
        currentIndex = 0;
        score = 0;
        startTime = new Date();
        localStorage.setItem("startTime", startTime.toISOString());
        feedback.textContent = '';
        showQuestion();
    } catch (err) {
        quizContainer.innerHTML = '<p>Lỗi tải dữ liệu câu hỏi.</p>';
        console.error(err);
    }
}

function showQuestion() {
    const question = questions[currentIndex];
    quizContainer.innerHTML = `
        <h3 style="text-align: left">Câu ${currentIndex + 1}: ${question.NoiDung}</h3>
        <button class="quiz-option" data-answer="A">A. ${question.DapAnA}</button>
        <button class="quiz-option" data-answer="B">B. ${question.DapAnB}</button>
        <button class="quiz-option" data-answer="C">C. ${question.DapAnC}</button>
        <button class="quiz-option" data-answer="D">D. ${question.DapAnD}</button>
    `;
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', () => {
            const answer = option.dataset.answer;
            const correct = question.DapAnDung;
            question.userAnswer = answer;
            document.querySelectorAll('.quiz-option').forEach(btn => {
                btn.disabled = true;
                if (btn.dataset.answer === correct) {
                    btn.style.backgroundColor = 'green';
                    btn.innerHTML += ' ✓ Đúng';
                } else if (btn.dataset.answer === answer) {
                    btn.style.backgroundColor = 'red';
                    btn.innerHTML += ' ✗ Sai';
                }
            });
            if (answer === correct) score++;
            setTimeout(() => {
                currentIndex++;
                if (currentIndex < questions.length) {
                    showQuestion();
                } else {
                    showResult();
                }
            }, 1000);
        });
    });
}

function showResult() {
    const thoiGianKetThuc = new Date().toISOString();
    const thoiGianBatDau = localStorage.getItem("startTime");
    const maND = parseInt(localStorage.getItem("maND"));
    if (!maND) return alert("Bạn cần đăng nhập để lưu kết quả.");

    const chiTiet = questions.map(q => ({
        MaCauHoi: q.MaCauHoi,
        DapAnChon: q.userAnswer || '',
        KetQua: q.userAnswer === q.DapAnDung
    }));

    fetch("http://localhost:3000/api/luu-ket-qua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            maND,
            diem: score,
            thoiGianBatDau,
            thoiGianKetThuc,
            chiTiet
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("✅ Đã lưu bài làm:", data);
        hienThiLichSu();
    })
    .catch(err => console.error("❌ Không lưu được:", err));

    let resultHTML = `<h3>🎉 Bạn đã hoàn thành!</h3><p>Điểm của bạn: ${score}/${questions.length}</p><hr><h4>Chi tiết:</h4><div style="text-align: left">`;
    questions.forEach((q, i) => {
        resultHTML += `<div style="margin-bottom: 10px">
            <strong>Câu ${i + 1}</strong>: ${q.NoiDung}<br>
            ✨ Bạn chọn: <strong>${q.userAnswer || "Không chọn"}</strong> – ${q.userAnswer === q.DapAnDung ? '✓ Đúng' : '✗ Sai'}
        </div>`;
    });
    resultHTML += '</div>';
    quizContainer.innerHTML = resultHTML + `<button onclick="startQuiz()">🔁 Làm lại</button><br><br><button onclick="location.href='index.html'">🏠 Quay về Trang Chính</button><div id="lichSuContainer" style="margin-top: 20px; text-align: left"></div>`;
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

async function hienThiLichSu() {
    const maND = localStorage.getItem("maND");
    if (!maND) return;
    try {
        const res = await fetch(`http://localhost:3000/api/lich-su/${maND}`);
        const data = await res.json();
        let html = '<h3>🕘 Lịch sử làm bài</h3><div style="text-align: left">';
        data.forEach(entry => {
            html += `<div style="margin-bottom: 10px; padding: 10px; background: #ffffff; color: #333; border-left: 5px solid #007bff; border-radius: 4px">
                📘 Bài: ${entry.MaBai} – 🕒 ${new Date(entry.ThoiGianBatDau).toLocaleString()} 
                → ${new Date(entry.ThoiGianKetThuc).toLocaleTimeString()}<br>
                ✅ Điểm: ${entry.Diem}/20
            </div>`;
        });
        html += '</div>';
        document.getElementById("lichSuContainer").innerHTML = html;
    } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
    }
}
