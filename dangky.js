// Cấu hình Firebase (thay bằng cấu hình thật của bạn nếu khác)
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

document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const tenDangNhap = document.getElementById("username").value.trim();
  const matKhau = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  if (!tenDangNhap || !matKhau) {
    message.style.color = "red";
    message.innerText = "⚠️ Vui lòng nhập đầy đủ thông tin.";
    return;
  }

  try {
    // Kiểm tra tài khoản đã tồn tại chưa
    const snapshot = await db.collection("NguoiDung")
      .where("TenDangNhap", "==", tenDangNhap)
      .get();

    if (!snapshot.empty) {
      message.style.color = "red";
      message.innerText = "❌ Tên đăng nhập đã tồn tại.";
      return;
    }

    // Thêm người dùng mới
    await db.collection("NguoiDung").add({
      TenDangNhap: tenDangNhap,
      MatKhau: matKhau
    });

    message.style.color = "green";
    message.innerText = "✅ Đăng ký thành công. Hãy đăng nhập.";
  } catch (err) {
    console.error(err);
    message.style.color = "red";
    message.innerText = "❌ Lỗi kết nối Firebase.";
  }
});
