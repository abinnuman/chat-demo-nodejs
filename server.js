const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const socketIo = require("socket.io");
const path = require("path");

// App setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect("mongodb+srv://anasbinnuman:wllK7tym4Y7vJ3uN@cluster0.punyi.mongodb.net/chat_demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error registering user", error });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Active users tracking
let activeUsers = [];

io.on("connection", (socket) => {
  socket.on("userLoggedIn", (username) => {
    if (!activeUsers.find((user) => user.username === username)) {
      activeUsers.push({ username, socketId: socket.id });
    }
    io.emit("activeUsers", activeUsers);
  });

  socket.on("sendMessage", async (data) => {
    const { sender, receiver, message } = data;
    const recipientSocket = activeUsers.find((user) => user.username === receiver);
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveMessage", { sender, message });
    }

    // Save message to DB
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("activeUsers", activeUsers);
  });
});

// Start server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
