document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const tenDangNhap = document.getElementById("username").value;
    const matKhau = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        const res = await fetch("http://localhost:3000/api/dang-ky", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenDangNhap, matKhau })
        });

        const data = await res.json();
        if (res.ok) {
            message.style.color = "green";
            message.innerText = "✅ Đăng ký thành công. Hãy đăng nhập.";
        } else {
            message.style.color = "red";
            message.innerText = `❌ ${data.error || 'Đăng ký thất bại.'}`;
        }
    } catch (err) {
        message.style.color = "red";
        message.innerText = "⚠️ Lỗi kết nối server.";
        console.error(err);
    }
});
