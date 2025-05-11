// Khởi tạo Firebase (CDN compat)
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

// Biến trạng thái
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
    const snapshot = await db.collection("CauHoi").get();
    const data = snapshot.docs.map(doc => doc.data());
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
  const maND = localStorage.getItem("maND");
  if (!maND) return alert("Bạn cần đăng nhập để lưu kết quả.");

  const chiTiet = questions.map(q => ({
    MaCauHoi: q.MaCauHoi,
    DapAnChon: q.userAnswer || '',
    KetQua: q.userAnswer === q.DapAnDung
  }));

  db.collection("BaiLamTracNghiem").add({
    MaNguoiDung: maND,
    Diem: score,
    ThoiGianBatDau: thoiGianBatDau,
    ThoiGianKetThuc: thoiGianKetThuc,
    ChiTiet: chiTiet
  }).then(() => {
    console.log("✅ Đã lưu bài làm");
    hienThiLichSu();
  }).catch((err) => {
    console.error("❌ Không lưu được:", err);
  });

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
  const maND = parseInt(localStorage.getItem("maND"));
if (!maND) return;

  try {
    const snapshot = await db.collection("BaiLamTracNghiem")
      .where("MaNguoiDung", "==", maND)
      .orderBy("ThoiGianBatDau", "desc")
      .limit(5)
      .get();

    let html = '<h3>🕘 Lịch sử làm bài</h3><div style="text-align: left">';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `<div style="margin-bottom: 10px; padding: 10px; background: #ffffff; color: #333; border-left: 5px solid #007bff; border-radius: 4px">
          📘 Mã bài: ${doc.id} – 🕒 ${new Date(data.ThoiGianBatDau).toLocaleString()}
          → ${new Date(data.ThoiGianKetThuc).toLocaleTimeString()}<br>
          ✅ Điểm: ${data.Diem}/20
      </div>`;
    });
    html += '</div>';
    document.getElementById("lichSuContainer").innerHTML = html;
  } catch (err) {
    console.error("Lỗi lấy lịch sử:", err);
  }
}
