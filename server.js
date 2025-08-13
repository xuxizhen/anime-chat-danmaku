const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));

const users = new Map();
const messages = [];
const MAX_MESSAGES = 100;

function generateRandomNickname() {
  const adjectives = ['可爱的', '神秘的', '闪亮的', '温柔的', '活泼的', '梦幻的', '甜美的', '酷炫的'];
  const nouns = ['小猫', '星星', '彩虹', '樱花', '月亮', '天使', '精灵', '独角兽'];
  return adjectives[Math.floor(Math.random() * adjectives.length)] + 
         nouns[Math.floor(Math.random() * nouns.length)] + 
         Math.floor(Math.random() * 999);
}

function generateUserStyle() {
  const avatars = ['🐱', '🐶', '🦊', '🐰', '🐼', '🦄', '🌟', '💫', '⭐', '🔥', '💖', '🌈', '🎀', '🍀'];
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fab1a0', '#fd79a8', '#a29bfe'];
  
  return {
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  const userStyle = generateUserStyle();
  const user = {
    id: socket.id,
    nickname: generateRandomNickname(),
    avatar: userStyle.avatar,
    color: userStyle.color,
    joinTime: Date.now()
  };
  
  users.set(socket.id, user);
  
  socket.emit('welcome', {
    user: user,
    messages: messages.slice(-50), ``
    onlineCount: users.size
  });
  
  io.emit('userCountUpdate', users.size);
  
  socket.on('updateNickname', (newNickname) => {
    const user = users.get(socket.id);
    if (user && newNickname && newNickname.trim().length > 0) {
      user.nickname = newNickname.trim().substring(0, 20);
      users.set(socket.id, user);
      socket.emit('nicknameUpdated', user.nickname);
    }
  });
  
  socket.on('sendMessage', (messageText) => {
    const user = users.get(socket.id);
    if (!user || !messageText || messageText.trim().length === 0) {
      return;
    }
    
    const message = {
      id: Date.now() + Math.random(),
      userId: socket.id,
      nickname: user.nickname,
      text: messageText.trim().substring(0, 200),
      avatar: user.avatar,
      color: user.color,
      timestamp: Date.now()
    };
    
    messages.push(message);
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }
    
    io.emit('newMessage', message);
  });
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    users.delete(socket.id);
    io.emit('userCountUpdate', users.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
