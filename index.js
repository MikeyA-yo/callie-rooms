const express = require("express");
const app = express()
const http = require("http");
const socket = require("socket.io")
const server = http.createServer(app);

const port = process.env.PORT || 3000

const io = new socket.Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })
app.get("/", (req, res)=>{
  res.send("Hello socket.io")
})
io.on('connection', (socket) => {
    socket.on("join-room", (roomId, userId)=>{
        socket.join(roomId);
        socket.to(roomId).except(socket.id).emit("joined", userId);
        socket.on("chat", (data)=>{
          console.log(data)
          socket.to(roomId).emit('data', data)
        });
        socket.on("close-cam", ()=>{
          socket.to(roomId).except(socket.id).emit('user-disconnected', userId)
        })
        socket.on('disconnect', () => {
            socket.to(roomId).except(socket.id).emit('user-disconnected', userId)
        });
        socket.on("end", ()=>{
            socket.leave(roomId)
        })
    })
   
  });
server.listen(port, ()=>{
    console.log(`Running on port ${port === 3000 ? "3k" : port}`)
})