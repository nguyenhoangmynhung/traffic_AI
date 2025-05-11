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

// Hiển thị thông tin biển báo từ API
function hienThiThongTin(ma, elementId) {
    const div = document.getElementById(elementId);
    div.style.display = "block"; // Hiện vùng thông tin

    fetch(`http://localhost:3000/api/bien-bao/${ma}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                div.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
            } else {
                // Gán dữ liệu vào từng vùng tương ứng
                if (elementId === "infoCamera") {
                    document.getElementById("tenBienCam").innerText = data.TenBien;
                    document.getElementById("moTaCam").innerText = data.MoTa;
                    document.getElementById("mucPhatCam").innerText = data.MucPhat;
                    document.getElementById("tenLoaiCam").innerText = data.TenLoai;
                    } else {
                    document.getElementById("tenBienImg").innerText = data.TenBien;
                    document.getElementById("moTaImg").innerText = data.MoTa;
                    document.getElementById("mucPhatImg").innerText = data.MucPhat;
                    document.getElementById("tenLoaiImg").innerText = data.TenLoai;
                       }
            }
        })
        .catch(err => {
            div.innerHTML = `<p style="color:red;">❌ Không thể kết nối tới server</p>`;
            console.error("❌ Lỗi API:", err);
        });
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
