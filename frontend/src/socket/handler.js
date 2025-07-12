// src/socket/handlers.js

export const handleJoinRoom = ({ socket, io, roomId, rooms }) => {
  if (!rooms[roomId]) {
    rooms[roomId] = { players: [] };
  }

  const room = rooms[roomId];
  if (room.players.length >= 2) {
    socket.emit('join-error', 'Room is full');
    return;
  }

  socket.join(roomId);
  room.players.push(socket);

  // If two joined — start game
  if (room.players.length === 2) {
    const [player1, player2] = room.players;

    // Assign colors: white starts
    player1.emit('assign-color', 'w');
    player2.emit('assign-color', 'b');

    // Let both know the game is starting
    io.to(roomId).emit('opponent-joined');
  } else {
    // Only one player — still waiting
    socket.emit('waiting');
  }
};

export const handleMove = ({ socket, io, rooms, payload }) => {
  const { roomId, move: newMove, position: newPosition } = payload;
  if (!rooms[roomId]) return;

  // Save moves if needed: rooms[roomId].moves = ...
  socket.to(roomId).emit('opponent-move', { newMove, newPosition });
};

export const handleGameOver = ({ io, rooms, payload }) => {
  const { roomId, result } = payload;
  io.to(roomId).emit('game-ended', result);

  // Optionally clean up room
  if (rooms[roomId]) {
    delete rooms[roomId];
  }
};
