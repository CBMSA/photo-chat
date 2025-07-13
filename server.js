// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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


