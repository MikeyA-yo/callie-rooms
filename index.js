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
const rooms = {}
io.on('connection', (socket) => {
    socket.on("join-room", (roomId, userId, uname, muted, offed)=>{
        socket.join(roomId);
        if(!rooms[roomId]){
          rooms[roomId] = []
        }
        rooms[roomId].push({
          userId,
          uname,
          muted,
          offed
        })
        io.to(roomId).emit("updateP",rooms[roomId]);
        socket.to(roomId).except(socket.id).emit("joined", userId);
        socket.on("chat", (data, uname)=>{
          socket.to(roomId).emit('data', data, uname)
        });
        socket.on("close-cam", ()=>{
          socket.to(roomId).except(socket.id).emit('user-disconnected', userId)
        });
        socket.on("mute", (id, val) =>{
          socket.to(roomId).except(socket.id).emit('muted', id, val)
          for (let i = 0; i < rooms[roomId].length; i++){
            if(rooms[roomId][i].userId === id){
              rooms[roomId][i].muted = val;
              break
            }
          }
          io.to(roomId).emit("updateP", rooms[roomId]);
        })
        socket.on("off", (id, val) =>{
          socket.to(roomId).except(socket.id).emit('offed', id, val);
          for (let i = 0; i < rooms[roomId].length; i++){
            if(rooms[roomId][i].userId === id){
              rooms[roomId][i].offed = val;
              break
            }
          }
          io.to(roomId).emit("updateP", rooms[roomId]);
        })
        socket.on('disconnect', () => {
            rooms[roomId] = rooms[roomId].filter(user => user.userId !== userId);
            io.to(roomId).emit("updateP", rooms[roomId]);
            socket.to(roomId).except(socket.id).emit('user-disconnected', userId, rooms[roomId], uname)
        });
        socket.on("leave", () =>{
            rooms[roomId] = rooms[roomId].filter(user => user.userId !== userId);
            io.to(roomId).emit("updateP", rooms[roomId]);
            socket.to(roomId).except(socket.id).emit('user-disconnected', userId, rooms[roomId], uname)
        })
        socket.on("end", ()=>{
            socket.leave(roomId)
            rooms[roomId] = []
        })
    })
   
  });
server.listen(port, ()=>{
    console.log(`Running on port ${port === 3000 ? "3k" : port}`)
})