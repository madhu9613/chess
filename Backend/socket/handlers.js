export const handleJoinRoom = ({ socket, io, roomId, rooms }) => {
  console.log(`Player ${socket.id} joined room ${roomId}`);

  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      moves: [],
      boardState: Array(8).fill().map(() => Array(8).fill(''))
    };
  }

  const room = rooms[roomId];

  // Prevent duplicate joins
  if (room.players.some(p => p.id === socket.id)) {
    console.log(`Player ${socket.id} already joined ${roomId}`);
    return;
  }

  if (room.players.length >= 2) {
    console.log(`Room ${roomId} is full`);
    socket.emit("join-error", "Room is full");
    return;
  }

  socket.join(roomId);
  
  // Store player info minimally
  room.players.push({
    id: socket.id,
    color: room.players.length === 0 ? 'w' : 'b'
  });

  // Send initial board state to new player
  socket.emit("initial-state", room.boardState);

  if (room.players.length === 2) {
    console.log(`Room ${roomId} now has 2 players. Starting game.`);
    
    // Notify both players
    room.players.forEach(player => {
      io.to(player.id).emit("assign-color", player.color);
    });
    
    io.to(roomId).emit("opponent-joined");
  } else {
    console.log(`Room ${roomId} waiting for opponent`);
    socket.emit("waiting");
  }
};

export const handleMove = ({ socket, io, rooms, payload }) => {
  const { roomId, move, position } = payload;
  
  if (!rooms[roomId]) {
    console.error(`Room ${roomId} not found`);
    return;
  }

  // Update room state
  rooms[roomId].moves.push(move);
  rooms[roomId].boardState = position;

  // Broadcast move to all players except sender
 socket.to(roomId).emit("opponent-move", { newMove: move, newPosition: position });

};

export const handleGameOver = ({ io, rooms, payload }) => {
  const { roomId, result } = payload;
  
  if (rooms[roomId]) {
    io.to(roomId).emit("gameEnded", result);
    delete rooms[roomId];
  }
};