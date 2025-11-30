
const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const modelSelect = document.getElementById("modelSelect");
const loading = document.getElementById("loading");
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// LOAD SAVED DATA
chrome.storage.local.get(["chatHistory", "model", "theme"], (data) => {
  if (data.chatHistory) chat.innerHTML = data.chatHistory;
  if (data.model) modelSelect.value = data.model;
  if (data.theme) body.className = data.theme;
  themeToggle.textContent = body.className === "light" ? "🌙" : "☀️";
});

// SAVE MODEL
modelSelect.onchange = () => {
  chrome.storage.local.set({ model: modelSelect.value });
};

// THEME TOGGLE
themeToggle.onclick = () => {
  body.className = body.className === "dark" ? "light" : "dark";
  themeToggle.textContent = body.className === "light" ? "🌙" : "☀️";
  chrome.storage.local.set({ theme: body.className });
};

// ENTER TO SEND (NO SEND BUTTON)
msg.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ✅ AUTO GROW TEXTAREA LIKE REAL CHAT APPS
msg.addEventListener("input", () => {
  msg.style.height = "auto";
  msg.style.height = msg.scrollHeight + "px";
});


async function sendMessage() {
  const text = msg.value.trim();
  if (!text) return;

  const time = new Date().toLocaleTimeString();
  chat.innerHTML += `<div class="user">${text}<div class="time">${time}</div></div>`;
  msg.value = "";
  chat.scrollTop = chat.scrollHeight;

  loading.classList.remove("hidden");

  chrome.storage.local.get(["apiKey", "model"], async (data) => {
    if (!data.apiKey) {
      const key = prompt("Enter your API Key");
      chrome.storage.local.set({ apiKey: key });
      data.apiKey = key;
    }

    try {
      let response;
      // SHOW
      if (data.model === "openai") {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${data.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: text }]
          })
        });
      }

      if (data.model === "gemini") {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${data.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text }] }]
            })
          }
        );
      }
      // HIDE
      
      if (!response || !response.ok) throw new Error("API request failed");

      const result = await response.json();
      const reply = data.model === "openai"
        ? result.choices[0].message.content
        : result.candidates[0].content.parts[0].text;

      const t2 = new Date().toLocaleTimeString();
      chat.innerHTML += `<div class="ai">${reply}<div class="time">${t2}</div></div>`;
    } catch (e) {
      chat.innerHTML += `<div class="ai">❌ Error: ${e.message}</div>`;
    }

    loading.classList.add("hidden");
    chrome.storage.local.set({ chatHistory: chat.innerHTML });
    chat.scrollTop = chat.scrollHeight;
  });

}

// ✅ SCREEN SWITCHING LOGIC
const openSettings = document.getElementById("openSettings");
const backBtn = document.getElementById("backBtn");
const mainScreen = document.getElementById("mainScreen");
const settingsScreen = document.getElementById("settingsScreen");

openSettings.onclick = () => {
  mainScreen.classList.remove("active");
  settingsScreen.classList.add("active");
};

backBtn.onclick = () => {
  settingsScreen.classList.remove("active");
  mainScreen.classList.add("active");
};
