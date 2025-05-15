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

let classifier, video, imageElement;
let imageModelURL = "https://teachablemachine.withgoogle.com/models/elBllFEWI/";

function preload() {
  classifier = ml5.imageClassifier(imageModelURL + "model.json", modelLoaded);
}

function modelLoaded() {
  console.log("✅ Mô hình AI đã tải thành công!");
}

function setup() {
  noCanvas();
  video = createCapture({ video: true });
  video.size(400, 320);
  video.parent("videoContainer");

  document.getElementById("imageUpload").addEventListener("change", handleFileUpload);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imageElement = document.createElement("img");
  imageElement.src = url;
  imageElement.width = 400;
  imageElement.height = 320;
  const preview = document.getElementById("previewImage");
  preview.innerHTML = "";
  preview.appendChild(imageElement);
}

function classifyVideo() {
  if (!classifier) return alert("Mô hình chưa sẵn sàng!");
  classifier.classify(video, gotResultCamera);
}

function predictImage() {
  if (!imageElement) return alert("Vui lòng tải ảnh trước!");
  classifier.classify(imageElement, gotResultImage);
}

function gotResultCamera(err, results) {
  if (err) return console.error(err);
  const ma = chuanHoaMa(results[0].label);
  document.getElementById("resultCamera").innerText = "Kết quả: " + ma;
  playAudio(ma);
  hienThiThongTin(ma, "Camera");
}

function gotResultImage(err, results) {
  if (err) return console.error(err);
  const ma = chuanHoaMa(results[0].label);
  document.getElementById("resultImage").innerText = "Kết quả: " + ma;
  playAudio(ma);
  hienThiThongTin(ma, "Image");
}

function chuanHoaMa(label) {
  const match = label.trim().toUpperCase().match(/^([A-Z]+\d+)/);
  return match ? match[1] : label;
}

function playAudio(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "vi-VN";
  window.speechSynthesis.speak(msg);
}
function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "vi-VN";
  speech.rate = 0.9; // Nói chậm lại cho dễ nghe
  window.speechSynthesis.speak(speech);
}
async function hienThiThongTin(ma, mode) {
  const infoBox = document.getElementById(`info${mode}`);
  infoBox.style.display = "block";

  try {
    const docRef = db.collection("BienBao").doc(ma);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      infoBox.innerHTML = `<p style="color:red;">❌ Không tìm thấy biển báo: ${ma}</p>`;
      return;
    }

    const bien = docSnap.data();
    const loaiSnap = await db.collection("LoaiBienBao").doc(bien.MaLoai).get();
    const tenLoai = loaiSnap.exists ? loaiSnap.data().TenLoai : "Không rõ";

    infoBox.innerHTML = `
      <h4>📘 Thông tin biển báo:</h4>
      <p><strong>Tên biển:</strong> ${bien.TenBien}</p>
      <p><strong>Mô tả:</strong> ${bien.MoTa}</p>
      <p><strong>Mức phạt:</strong> ${bien.MucPhat}</p>
      <p><strong>Loại biển:</strong> ${tenLoai}</p>
    `;
  } catch (err) {
    infoBox.innerHTML = `<p style="color:red;">❌ Lỗi kết nối Firestore</p>`;
    console.error(err);
  }
}
