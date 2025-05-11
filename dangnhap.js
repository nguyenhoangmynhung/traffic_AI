document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const tenDangNhap = document.getElementById("username").value;
    const matKhau = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        const res = await fetch("http://localhost:3000/api/dang-nhap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenDangNhap, matKhau })
        });

        const data = await res.json();
        if (res.ok) {
            message.style.color = "green";
            message.innerText = "✅ Đăng nhập thành công.";
            localStorage.setItem("maND", data.MaND);
            setTimeout(() => window.location.href = "quiz.html", 1000);
        } else {
            message.style.color = "red";
            message.innerText = `❌ ${data.error || 'Đăng nhập thất bại.'}`;
        }
    } catch (err) {
        message.style.color = "red";
        message.innerText = "⚠️ Lỗi kết nối server.";
        console.error(err);
    }
});
