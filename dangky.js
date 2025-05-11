// Khởi tạo Firebase
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

async function dangKy() {
  const tenDangNhap = document.getElementById("tenDangNhap").value.trim();
  const hoTen = document.getElementById("hoTen").value.trim();
  const email = document.getElementById("email").value.trim();
  const matKhau = document.getElementById("matKhau").value;
  const result = document.getElementById("result");

  if (!tenDangNhap || !hoTen || !email || !matKhau) {
    result.style.color = "red";
    result.textContent = "⚠️ Vui lòng điền đầy đủ thông tin.";
    return;
  }

  try {
    // Kiểm tra trùng tên đăng nhập
    const snapshot = await db.collection("NguoiDung")
      .where("TenDangNhap", "==", tenDangNhap)
      .get();

    if (!snapshot.empty) {
      result.style.color = "red";
      result.textContent = "❌ Tên đăng nhập đã tồn tại!";
      return;
    }

    // Lưu người dùng mới
    await db.collection("NguoiDung").add({
      TenDangNhap: tenDangNhap,
      HoTen: hoTen,
      Email: email,
      MatKhau: matKhau
    });

    result.style.color = "green";
    result.textContent = "✅ Đăng ký thành công!";
    setTimeout(() => window.location.href = "dangnhap.html", 2000);

  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    result.style.color = "red";
    result.textContent = "❌ Lỗi kết nối Firebase.";
  }
}
