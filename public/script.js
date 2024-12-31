const socket = io("http://localhost:3000");

document.getElementById("signup-btn").addEventListener("click", async () => {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const res = await fetch("http://localhost:3000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  alert(res.ok ? "Signup successful" : "Signup failed");
});

document.getElementById("login-btn").addEventListener("click", async () => {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (res.ok) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("chat").style.display = "block";

    socket.emit("userLoggedIn", username);
    socket.on("activeUsers", (users) => {
      document.getElementById("users").innerHTML = users
        .map((u) => `<p>${u.username}</p>`)
        .join("");
    });

    socket.on("receiveMessage", ({ sender, message }) => {
      const messages = document.getElementById("messages");
      messages.innerHTML += `<p><strong>${sender}:</strong> ${message}</p>`;
    });
  } else {
    alert("Login failed");
  }
});

document.getElementById("send-btn").addEventListener("click", () => {
  const message = document.getElementById("message-input").value;
  const receiver = prompt("Enter recipient username:");
  const username = document.getElementById("login-username").value;
  socket.emit("sendMessage", { sender: username, receiver, message });
});
