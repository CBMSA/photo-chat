// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());

// Simulated database for subscriptions
const subscriptions = [];

// Storage for presentation uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Presentation upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ success: true, file: `/uploads/${req.file.filename}` });
});

// Subscription API
app.post('/api/subscribe', (req, res) => {
  const { name, email, proof } = req.body;
  if (!name || !email || !proof) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  subscriptions.push({ name, email, proof, verified: false });
  res.json({ success: true, message: 'Subscription submitted for approval' });
});

// Admin dashboard route
app.get('/admin/subscriptions', (req, res) => {
  let html = '<h2>Subscription Requests</h2><ul>';
  subscriptions.forEach((sub, index) => {
    html += `<li><strong>${sub.name}</strong> (${sub.email})<br>Proof: ${sub.proof}<br><button onclick="fetch('/admin/verify/${index}', {method: 'POST'}).then(() => location.reload())">Verify</button></li>`;
  });
  html += '</ul>';
  res.send(html);
});

app.post('/admin/verify/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (subscriptions[id]) {
    subscriptions[id].verified = true;
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Socket.IO signaling
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join-room', room => {
    socket.join(room);
    socket.to(room).emit('user-connected', socket.id);

    socket.on('signal', data => {
      socket.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal
      });
    });

    socket.on('disconnect', () => {
      socket.to(room).emit('user-disconnected', socket.id);
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


📦 package.json

Run this to create the package.json automatically:

npm init -y
npm install express socket.io multer body-parser


