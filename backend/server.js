const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

// State storage
// rooms[roomCode] = {
//   players: { socketId1: { role: 'Player 1', score: 0, choice: null, isBatting: true }, ... },
//   status: 'WAITING' | 'PLAYING' | 'CHASING' | 'GAMEOVER',
//   target: null
// }
const rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: {},
      status: 'WAITING',
      target: null
    };
    
    // Creator joins as Player 1
    rooms[roomCode].players[socket.id] = {
      id: socket.id,
      role: 'Player 1',
      score: 0,
      choice: null,
      isBatting: true,
      ready: false
    };

    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, role: 'Player 1' });
  });

  socket.on('joinRoom', ({ roomCode }) => {
    roomCode = roomCode.toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
      return socket.emit('error', 'Room not found');
    }

    const playerIds = Object.keys(room.players);
    if (playerIds.length >= 2) {
      return socket.emit('error', 'Room is full');
    }

    // Joiner becomes Player 2
    room.players[socket.id] = {
      id: socket.id,
      role: 'Player 2',
      score: 0,
      choice: null,
      isBatting: false,
      ready: false
    };

    socket.join(roomCode);
    socket.emit('roomJoined', { roomCode, role: 'Player 2' });
  });

  socket.on('playerReady', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players[socket.id];
    if (player) {
      player.ready = true;
    }

    const players = Object.values(room.players);
    if (players.length === 2 && players.every(p => p.ready)) {
      room.status = 'PLAYING';
      io.to(roomCode).emit('gameStart', {
        players: players,
        turn: 'Player 1'
      });
    }
  });

  socket.on('makeChoice', ({ roomCode, choice }) => {
    const room = rooms[roomCode];
    if (!room || room.status === 'GAMEOVER') return;
    
    const player = room.players[socket.id];
    if (player) {
      player.choice = choice;
    }

    // Check if both players have made a choice
    const players = Object.values(room.players);
    if (players.length === 2 && players[0].choice !== null && players[1].choice !== null) {
      evaluateRound(roomCode, room);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle player disconnect: remove room and notify other player
    for (const roomCode in rooms) {
      if (rooms[roomCode].players[socket.id]) {
        io.to(roomCode).emit('error', 'Opponent disconnected');
        delete rooms[roomCode];
        break;
      }
    }
  });
});

function evaluateRound(roomCode, room) {
  const p1 = Object.values(room.players).find(p => p.role === 'Player 1');
  const p2 = Object.values(room.players).find(p => p.role === 'Player 2');

  const batter = p1.isBatting ? p1 : p2;
  const bowler = p1.isBatting ? p2 : p1;

  const result = {
    p1Choice: p1.choice,
    p2Choice: p2.choice,
    outcome: '', // 'run', 'out'
    gameOver: false,
    winner: null,
    reason: ''
  };

  if (p1.choice === p2.choice) {
    // Wicket!
    result.outcome = 'out';
    
    if (p1.isBatting) {
      // End of Player 1's innings
      room.status = 'CHASING';
      room.target = p1.score + 1;
      p1.isBatting = false;
      p2.isBatting = true;
      result.reason = 'Player 1 is OUT! Player 2 needs ' + room.target + ' to win.';
      result.newTurn = 'Player 2';
      result.target = room.target;
    } else {
      // End of Player 2's innings
      room.status = 'GAMEOVER';
      result.gameOver = true;
      result.winner = 'Player 1';
      result.reason = 'Player 2 is OUT! Player 1 wins the match!';
    }
  } else {
    // Runs scored
    result.outcome = 'run';
    batter.score += batter.choice;

    if (p2.isBatting && p2.score >= room.target) {
      // Player 2 chased the target
      room.status = 'GAMEOVER';
      result.gameOver = true;
      result.winner = 'Player 2';
      result.reason = 'Player 2 successfully chased the target!';
    } else if (p2.isBatting && p2.score === room.target - 1 && room.status === 'GAMEOVER') {
        // Technically not possible in this logic block but handled above
    }
  }

  // Reset choices for the next round
  p1.choice = null;
  p2.choice = null;

  // Emit the result of the round
  io.to(roomCode).emit('revealChoices', {
    ...result,
    p1Score: p1.score,
    p2Score: p2.score,
    target: room.target
  });

  if (result.gameOver) {
    io.to(roomCode).emit('gameOver', {
      winner: result.winner,
      reason: result.reason
    });
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
