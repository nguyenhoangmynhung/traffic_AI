// chatbotAI.js
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("questionInputAI");
  const sendButton = document.getElementById("sendButtonAI");
  const voiceButton = document.getElementById("voiceButtonAI");
  const responseContainer = document.getElementById("chatbotResponseAI");

  sendButton?.addEventListener("click", sendQuestionAI);
  voiceButton?.addEventListener("click", startListening);

  async function sendQuestionAI() {
    const question = inputField.value.trim();
    if (!question) return alert("⚠️ Vui lòng nhập câu hỏi cho AI!");

    responseContainer.innerHTML = "⏳ Đang xử lý câu hỏi...";

    try {
      const aiResponse = await getAIResponse(question); // Gọi API hoặc logic AI ở đây

      responseContainer.innerHTML = aiResponse;
      speakText(aiResponse);
    } catch (err) {
      console.error("❌ Lỗi xử lý câu hỏi:", err);
      responseContainer.innerHTML = "❌ Không thể xử lý câu hỏi của bạn!";
    }
  }

  // Hàm gọi API AI
  async function getAIResponse(question) {
    // Gọi API AI như OpenAI hoặc xử lý logic AI ở đây
    // Ví dụ:
    return "AI trả lời cho câu hỏi của bạn: " + question; // Giả lập AI trả lời
  }

  function speakText(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "vi-VN";
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  }

  function startListening() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      inputField.value = transcript;
      sendQuestionAI();
    };
    recognition.onerror = () => responseContainer.innerHTML = "❌ Lỗi nhận diện giọng nói!";
    recognition.start();
  }
});
