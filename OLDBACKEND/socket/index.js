import { handleJoinRoom, handleMove, handleGameOver } from "./handlers.js";

export const registerSocketHandlers = (io) => {
  const rooms = {};

  io.on("connection", (socket) => {
    console.log("New client:", socket.id);

    socket.on("joinRoom", (roomId) => 
      handleJoinRoom({ socket, io, roomId, rooms })
    );

    socket.on("makeMove", (payload) => 
      handleMove({ socket, io, rooms, payload })
    );

    socket.on("gameOver", (payload) => 
      handleGameOver({ io, rooms, payload })
    );

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          // Notify remaining player
          room.players.splice(playerIndex, 1);
          
          if (room.players.length > 0) {
            io.to(room.players[0].id).emit("opponent-disconnected");
          }
          
          if (room.players.length === 0) {
            delete rooms[roomId];
          }
          break;
        }
      }
    });
  });
};