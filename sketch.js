<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

<script>
  // Firebase config dạng compat
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

  let classifier;
  let video;
  let imageElement;
  let imageModelURL = "https://teachablemachine.withgoogle.com/models/elBllFEWI/";

  function preload() {
    classifier = ml5.imageClassifier(imageModelURL + "model.json", modelLoaded);
  }

  function modelLoaded() {
    console.log("✅ Mô hình AI đã tải xong");
  }

  function setup() {
    noCanvas();
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
    document.getElementById("imageUpload").addEventListener("change", handleFileUpload);
  }

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

  function classifyVideo() {
    if (!classifier) {
      alert("⚠️ Mô hình chưa sẵn sàng!");
      return;
    }
    classifier.classify(video, gotResultCamera);
  }

  function predictImage() {
    if (!imageElement) {
      alert("⚠️ Vui lòng tải ảnh trước!");
      return;
    }
    classifier.classify(imageElement, gotResultImage);
  }

  function gotResultCamera(error, results) {
    if (error) {
      console.error("❌ Lỗi camera:", error);
      return;
    }
    let ma = chuanHoaMa(results[0].label);
    document.getElementById("resultCamera").innerText = "Kết quả: " + ma;
    playAudio(ma);
    hienThiThongTin(ma, "Camera");
  }

  function gotResultImage(error, results) {
    if (error) {
      console.error("❌ Lỗi ảnh:", error);
      return;
    }
    let ma = chuanHoaMa(results[0].label);
    document.getElementById("resultImage").innerText = "Kết quả: " + ma;
    playAudio(ma);
    hienThiThongTin(ma, "Image");
  }

  function chuanHoaMa(label) {
    let ma = label.trim().toUpperCase();
    let match = ma.match(/^([A-Z]+\d+)/);
    return match ? match[1] : ma;
  }

  function playAudio(text) {
    let speech = new SpeechSynthesisUtterance(text);
    speech.lang = "vi-VN";
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  async function hienThiThongTin(ma, mode) {
    const infoBox = document.getElementById(`info${mode}`);
    infoBox.style.display = "block";
    infoBox.innerHTML = `
      <h4>📘 Thông tin biển báo:</h4>
      <p><strong>Tên biển:</strong> <span id="tenBien${mode}"></span></p>
      <p><strong>Mô tả:</strong> <span id="moTa${mode}"></span></p>
      <p><strong>Mức phạt:</strong> <span id="mucPhat${mode}"></span></p>
      <p><strong>Loại biển:</strong> <span id="tenLoai${mode}"></span></p>
    `;

    try {
      const bienDoc = await db.collection("BienBao").doc(ma).get();
      if (!bienDoc.exists) {
        infoBox.innerHTML = `<p style="color:red;">❌ Không tìm thấy biển: ${ma}</p>`;
        return;
      }
      const bien = bienDoc.data();
      const loaiDoc = await db.collection("LoaiBienBao").doc(bien.MaLoai).get();
      const tenLoai = loaiDoc.exists ? loaiDoc.data().TenLoai : "Không rõ";
      document.getElementById(`tenBien${mode}`).textContent = bien.TenBien;
      document.getElementById(`moTa${mode}`).textContent = bien.MoTa;
      document.getElementById(`mucPhat${mode}`).textContent = bien.MucPhat;
      document.getElementById(`tenLoai${mode}`).textContent = tenLoai;
    } catch (err) {
      infoBox.innerHTML = `<p style="color:red;">❌ Lỗi kết nối Firestore</p>`;
      console.error(err);
    }
  }

  function showMode(mode) {
    document.getElementById("videoContainer").style.display = mode === "camera" ? "block" : "none";
    document.getElementById("previewImage").style.display = mode === "image" ? "block" : "none";
  }

  window.predictImage = predictImage;
  window.classifyVideo = classifyVideo;
</script>
