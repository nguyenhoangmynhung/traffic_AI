
// Khởi tạo Firebase (giữ giống sketch.js để đồng bộ)
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

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const tenDangNhap = document.getElementById("username").value.trim();
  const matKhau = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  try {
    const querySnapshot = await db.collection("NguoiDung")
      .where("TenDangNhap", "==", tenDangNhap)
      .where("MatKhau", "==", matKhau)
      .get();

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      localStorage.setItem("maND", userDoc.id); // dùng id làm khóa
      localStorage.setItem("tenDangNhap", userData.TenDangNhap);

      message.style.color = "green";
      message.innerText = "✅ Đăng nhập thành công.";
      setTimeout(() => {
        const redirect = localStorage.getItem("redirectAfterLogin") || "index.html";
        window.location.href = redirect;
      }, 1000);
    } else {
      message.style.color = "red";
      message.innerText = "❌ Sai tên đăng nhập hoặc mật khẩu.";
    }
  } catch (err) {
    console.error(err);
    message.style.color = "red";
    message.innerText = "⚠️ Lỗi kết nối Firebase.";
  }
});
