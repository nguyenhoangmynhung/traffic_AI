import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let classifier;
let video;
let imageElement;
let imageModelURL = "https://teachablemachine.withgoogle.com/models/elBllFEWI/";

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBGzcRnvcrfSaejw_FPQZdmgbC76nX_XEo",
  authDomain: "trafficai-2a2d6.firebaseapp.com",
  projectId: "trafficai-2a2d6",
  storageBucket: "trafficai-2a2d6.firebasestorage.app",
  messagingSenderId: "29599829580",
  appId: "1:29599829580:web:4537c5749320276e88eee9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tải mô hình AI
function preload() {
    classifier = ml5.imageClassifier(imageModelURL + "model.json", modelLoaded);
}

function modelLoaded() {
    console.log("✅ Mô hình AI đã tải thành công!");
}

function setup() {
    noCanvas();

    // Thiết lập camera
    let constraints = {
        video: {
            width: { ideal: 400 },
            height: { ideal: 320 },
            facingMode: "user"
        }
    };

    video = createCapture(constraints);
    video.size(400, 320);
    video.parent("videoContainer");
    video.show();

    // Bắt sự kiện chọn ảnh
    document.getElementById("imageUpload").addEventListener("change", handleFileUpload);
}

// Xử lý khi người dùng chọn ảnh
function handleFileUpload(event) {
    let file = event.target.files[0];
    if (!file) return;

    let imgURL = URL.createObjectURL(file);
    imageElement = document.createElement("img");
    imageElement.src = imgURL;
    imageElement.width = 400;
    imageElement.height = 320;

    let previewContainer = document.getElementById("previewImage");
    previewContainer.innerHTML = "";
    previewContainer.appendChild(imageElement);
}

// Nhận diện từ camera
function classifyVideo() {
    if (!classifier) {
        alert("⚠️ Mô hình chưa sẵn sàng!");
        return;
    }
    classifier.classify(video, gotResultCamera);
}

// Nhận diện từ ảnh
function predictImage() {
    if (!imageElement) {
        alert("⚠️ Vui lòng tải ảnh trước!");
        return;
    }
    classifier.classify(imageElement, gotResultImage);
}

// Xử lý kết quả camera
function gotResultCamera(error, results) {
    if (error) {
        console.error("❌ Lỗi camera:", error);
        return;
    }

    let ma = chuanHoaMa(results[0].label);
    document.getElementById("resultCamera").innerText = "Kết quả: " + ma;
    playAudio(ma);
    hienThiThongTin(ma, "Cam");
}

// Xử lý kết quả ảnh
function gotResultImage(error, results) {
    if (error) {
        console.error("❌ Lỗi ảnh:", error);
        return;
    }

    let ma = chuanHoaMa(results[0].label);
    document.getElementById("resultImage").innerText = "Kết quả: " + ma;
    playAudio(ma);
    hienThiThongTin(ma, "Img");
}

// Chuẩn hóa mã (VD: I424abc -> I424)
function chuanHoaMa(label) {
    let ma = label.trim().toUpperCase();
    let match = ma.match(/^([A-Z]+\d+)/);
    return match ? match[1] : ma;
}

// Phát âm thanh tiếng Việt
function playAudio(text) {
    let speech = new SpeechSynthesisUtterance(text);
    speech.lang = "vi-VN";
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
}

// Hiển thị thông tin biển báo từ Firestore
async function hienThiThongTin(ma, mode) {
    const bienRef = doc(db, "BienBao", ma);
    const bienSnap = await getDoc(bienRef);

    const infoBox = document.getElementById(`info${mode}`);
    infoBox.style.display = "block";

    if (!bienSnap.exists()) {
        infoBox.innerHTML = `<p style="color:red;">❌ Không tìm thấy biển báo: ${ma}</p>`;
        return;
    }

    const bien = bienSnap.data();

    const loaiRef = doc(db, "LoaiBienBao", bien.MaLoai);
    const loaiSnap = await getDoc(loaiRef);
    const tenLoai = loaiSnap.exists() ? loaiSnap.data().TenLoai : "Không rõ";

    document.getElementById(`tenBien${mode}`).textContent = bien.TenBien;
    document.getElementById(`moTa${mode}`).textContent = bien.MoTa;
    document.getElementById(`mucPhat${mode}`).textContent = bien.MucPhat;
    document.getElementById(`tenLoai${mode}`).textContent = tenLoai;
}

// Hiển thị đúng khung camera hoặc ảnh
function showMode(mode) {
    const videoContainer = document.getElementById("videoContainer");
    const previewImage = document.getElementById("previewImage");

    if (mode === "camera") {
        videoContainer.style.display = "block";
        previewImage.style.display = "none";
    } else if (mode === "image") {
        videoContainer.style.display = "none";
        previewImage.style.display = "block";
    }
}
