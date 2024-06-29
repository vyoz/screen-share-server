const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Server } = require('ws');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('set-client-name', (clientName) => {
    socket.clientName = clientName;
    console.log(`${clientName} connected`);
  });

  socket.on('offer', (offer) => {
      console.log(`${socket.clientName} offer ...`);
      socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    console.log(`${socket.clientName} answer ...`);
    socket.broadcast.emit('answer', answer);
  });

  socket.on('candidate', (candidate) => {
    console.log(`${socket.clientName} candidate ...`);
    socket.broadcast.emit('candidate', candidate);
  });


  socket.on('disconnect', () => {
    console.log(`${socket.clientName} disconnected(outside)`);
  });

      
  socket.on('start-stream', () => {
    console.log(`${socket.clientName} start streaming ...`);
    const gst = spawn('gst-launch-1.0', [
      'videotestsrc', '!', 'videoconvert', '!', 'x264enc', '!', 'rtph264pay', '!', 'udpsink', 'host=127.0.0.1', 'port=5000'
    ]);

    gst.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    gst.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    gst.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

    socket.on('disconnect', () => {
      console.log(`${socket.clientName} disconnected(inside)`);
      gst.kill();
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
