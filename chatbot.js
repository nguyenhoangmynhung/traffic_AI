async function sendQuestion() {
  const queryText = inputField.value.trim().toUpperCase();
  if (!queryText) return alert("⚠️ Vui lòng nhập nội dung cần hỏi!");

  responseContainer.innerHTML = "⏳ Đang tìm kiếm thông tin...";
  const maND = localStorage.getItem("maND");
  let traLoi = "";

  try {
    const maMatch = queryText.match(/[A-Z]\d{2,3}[A-Z]?/);  // lấy mã biển như R305, P112A
    const ma = maMatch ? maMatch[0] : "";

    let snapshot = await db.collection("BienBao")
      .where("MaBien", "==", ma)
      .limit(1)
      .get();

    // Nếu không có mã, hoặc mã sai => tìm theo tên gần đúng
    if (snapshot.empty) {
      const all = await db.collection("BienBao").get();
      const matched = all.docs.find(doc =>
        doc.data().TenBien?.toUpperCase().normalize("NFC").includes(queryText)
      );
      if (matched) snapshot = { empty: false, docs: [matched] };
    }

    if (snapshot.empty) {
      traLoi = `Không tìm thấy mã biển báo ${queryText}`;
      responseContainer.innerHTML = `❌ ${traLoi}`;
      speakText(traLoi);
    } else {
      const data = snapshot.docs[0].data();
      traLoi = `${data.TenBien}. ${data.MoTa}. Mức phạt: ${data.MucPhat || 'không có quy định.'}`;
      const html = `
        ⚠️ <strong>Biển báo ${data.MaBien}</strong><br>
        📘 <strong>Tên:</strong> ${data.TenBien}<br>
        📝 <strong>Mô tả:</strong> ${data.MoTa}<br>
        💸 <strong>Mức phạt:</strong> ${data.MucPhat || 'Không có quy định'}<br>
        📌 <strong>Loại biển:</strong> ${data.TenLoai || 'Chưa xác định'}<br>`;
      responseContainer.innerHTML = html;
      speakText(traLoi);
    }

    if (maND) {
      await db.collection("ChatLog").add({
        MaND: maND,
        CauHoi: queryText,
        TraLoi: traLoi,
        ThoiGian: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("❌ Lỗi tìm kiếm:", err);
    responseContainer.innerHTML = "❌ Lỗi kết nối hoặc tìm kiếm!";
  }
}
