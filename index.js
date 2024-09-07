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
   const rooms = {}
    socket.on("join-room", (roomId, userId, uname)=>{
        socket.join(roomId);
        if(!rooms[roomId]){
          rooms[roomId] = []
        }
        rooms[roomId].push({
          userId,
          uname
        })
        
        socket.to(roomId).except(socket.id).emit("joined", userId, uname);
        io.to(roomId).emit("updateP", rooms[roomId]);
        socket.on("chat", (data, uname)=>{
          socket.to(roomId).emit('data', data, uname)
        });
        socket.on("close-cam", ()=>{
          socket.to(roomId).except(socket.id).emit('user-disconnected', userId)
        });
        socket.on("mute", (id) =>{
          socket.to(roomId).except(socket.id).emit('muted', id)
        })
        socket.on("off", (id) =>{
          socket.to(roomId).except(socket.id).emit('offed', id)
        })
        socket.on('disconnect', () => {
            rooms[roomId] = rooms[roomId].filter(user => user.userId !== userId);
            io.to(roomId).emit("updateP", rooms[roomId]);
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