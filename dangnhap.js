// Cấu hình Firebase
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

// Xử lý đăng nhập
function dangNhap() {
  const tenDangNhap = document.getElementById("tenDangNhap").value.trim();
  const matKhau = document.getElementById("matKhau").value.trim();
  const result = document.getElementById("result");

  if (!tenDangNhap || !matKhau) {
    result.textContent = "⚠ Vui lòng nhập đầy đủ thông tin.";
    result.style.color = "red";
    return;
  }

  db.collection("NguoiDung")
    .where("TenDangNhap", "==", tenDangNhap)
    .where("MatKhau", "==", matKhau)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        localStorage.setItem("maND", doc.id);
        localStorage.setItem("tenDangNhap", tenDangNhap);
        result.textContent = "✅ Đăng nhập thành công!";
        result.style.color = "green";

        const redirect = localStorage.getItem("redirectAfterLogin");
        setTimeout(() => {
          if (redirect) {
            localStorage.removeItem("redirectAfterLogin");
            window.location.href = redirect;
          } else {
            window.location.href = "index.html";
          }
        }, 1000);
      } else {
        result.textContent = "❌ Sai tài khoản hoặc mật khẩu.";
        result.style.color = "red";
      }
    })
    .catch(err => {
      console.error("Lỗi đăng nhập:", err);
      result.textContent = "⚠ Lỗi kết nối Firebase.";
      result.style.color = "red";
    });
}
</script>
