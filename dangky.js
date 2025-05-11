// Cấu hình Firebase dùng Firebase CDN (Compat version)
const firebaseConfig = {
  apiKey: "AIzaSyBGzcRnvcrfSaejw_FPQZdmgbC76nX_XEo",
  authDomain: "trafficai-2a2d6.firebaseapp.com",
  projectId: "trafficai-2a2d6",
  storageBucket: "trafficai-2a2d6.appspot.com",
  messagingSenderId: "29599829580",
  appId: "1:29599829580:web:4537c5749320276e88eee9"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const tenDangNhap = document.getElementById("username").value.trim();
    const matKhau = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    try {
        // Kiểm tra tài khoản đã tồn tại chưa
        const existing = await db.collection("NguoiDung")
            .where("TenDangNhap", "==", tenDangNhap)
            .get();

        if (!existing.empty) {
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
        message.style.color = "red";
        message.innerText = "⚠️ Lỗi khi kết nối Firebase.";
        console.error(err);
    }
});
