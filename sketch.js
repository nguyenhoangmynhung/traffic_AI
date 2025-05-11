let classifier;
let video;
let imageElement;
let imageModelURL = "https://teachablemachine.withgoogle.com/models/elBllFEWI/";

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
    hienThiThongTin(ma, "infoCamera");
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
    hienThiThongTin(ma, "infoImage");
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

// Hiển thị thông tin biển báo
async function hienThiThongTin(ma, mode) {
    const infoBox = document.getElementById(`info${mode}`);
    infoBox.style.display = "block";

    // Reset nội dung
    infoBox.innerHTML = `
        <h4>📘 Thông tin biển báo:</h4>
        <p><strong>Tên biển:</strong> <span id="tenBien${mode}"></span></p>
        <p><strong>Mô tả:</strong> <span id="moTa${mode}"></span></p>
        <p><strong>Mức phạt:</strong> <span id="mucPhat${mode}"></span></p>
        <p><strong>Loại biển:</strong> <span id="tenLoai${mode}"></span></p>
    `;

    try {
        const bienRef = doc(db, "BienBao", ma);
        const bienSnap = await getDoc(bienRef);

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
    } catch (error) {
        infoBox.innerHTML = `<p style="color:red;">❌ Không thể kết nối tới Firestore</p>`;
        console.error(error);
    }
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
