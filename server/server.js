const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ---- Data Store ----
const rooms = {};    // roomCode -> room object
const users = {};    // socketId -> user object

function generateCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

function getRoomSummary(room) {
  return {
    code: room.code,
    name: room.name,
    diff: room.diff,
    maxPlayers: room.maxPlayers,
    timeLimitMin: room.timeLimitMin,
    status: room.status,
    players: room.players.map(p => ({
      name: p.name, score: p.score,
      solved: p.solved, solveTime: p.solveTime,
      progress: p.progress, lang: p.lang
    }))
  };
}

// ---- Problems Bank ----
const PROBLEMS = {
  easy: {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    tags: ['Arrays', 'Hash Map'],
    constraints: '2 ≤ nums.length ≤ 10⁴'
  },
  medium: {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3' },
      { input: 's = "bbbbb"', output: '1' }
    ],
    tags: ['Sliding Window', 'String'],
    constraints: '0 ≤ s.length ≤ 5×10⁴'
  },
  hard: {
    title: 'Median of Two Sorted Arrays',
    description: 'Given two sorted arrays nums1 and nums2, return the median. Time complexity must be O(log(m+n)).',
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000' }
    ],
    tags: ['Binary Search', 'Divide & Conquer'],
    constraints: '0 ≤ m, n ≤ 1000'
  }
};

// ---- Socket Events ----
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user
  socket.on('register', ({ username }) => {
    users[socket.id] = {
      id: socket.id, name: username,
      rating: 1000, wins: 0, battles: 0, streak: 0
    };
    socket.emit('registered', users[socket.id]);
    socket.emit('room_list', Object.values(rooms).map(getRoomSummary));
  });

  // Get room list
  socket.on('get_rooms', () => {
    socket.emit('room_list', Object.values(rooms).map(getRoomSummary));
  });

  // Create room
  socket.on('create_room', ({ name, maxPlayers, diff, timeLimitMin, visibility }) => {
    const user = users[socket.id];
    if (!user) return;
    const code = generateCode();
    rooms[code] = {
      code, name, diff, maxPlayers, timeLimitMin, visibility,
      status: 'waiting',
      hostId: socket.id,
      problem: PROBLEMS[diff],
      players: [{
        socketId: socket.id, name: user.name,
        score: 0, solved: false, solveTime: null,
        progress: 0, lang: 'c'
      }],
      timerInterval: null,
      secondsLeft: timeLimitMin * 60
    };
    socket.join(code);
    socket.emit('room_created', getRoomSummary(rooms[code]));
    io.emit('room_list', Object.values(rooms).map(getRoomSummary));
    console.log(`Room ${code} created by ${user.name}`);
  });

  // Join room
  socket.on('join_room', ({ code }) => {
    const user = users[socket.id];
    const room = rooms[code];
    if (!user) return socket.emit('error', 'Not registered');
    if (!room) return socket.emit('error', 'Room not found');
    if (room.status === 'battle') return socket.emit('error', 'Battle already started');
    if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Room is full');
    if (room.players.find(p => p.socketId === socket.id)) return;

    room.players.push({
      socketId: socket.id, name: user.name,
      score: 0, solved: false, solveTime: null,
      progress: 0, lang: 'c'
    });
    socket.join(code);
    io.to(code).emit('player_joined', { player: user.name, room: getRoomSummary(room) });
    io.emit('room_list', Object.values(rooms).map(getRoomSummary));
  });

  // Start battle (host only)
  socket.on('start_battle', ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) return socket.emit('error', 'Need at least 2 players');
    room.status = 'battle';
    room.secondsLeft = room.timeLimitMin * 60;
    io.to(code).emit('battle_started', {
      room: getRoomSummary(room),
      problem: room.problem
    });

    // Timer
    room.timerInterval = setInterval(() => {
      room.secondsLeft--;
      io.to(code).emit('timer_tick', { secondsLeft: room.secondsLeft });
      if (room.secondsLeft <= 0) {
        clearInterval(room.timerInterval);
        room.status = 'finished';
        io.to(code).emit('battle_ended', { room: getRoomSummary(room) });
      }
    }, 1000);
    io.emit('room_list', Object.values(rooms).map(getRoomSummary));
  });

  // Update progress (typing indicator)
  socket.on('update_progress', ({ code, progress, lang }) => {
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.progress = progress;
      player.lang = lang;
      io.to(code).emit('progress_updated', getRoomSummary(room));
    }
  });

  // Submit solution
  socket.on('submit_solution', ({ code, passed }) => {
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.solved) return;
    if (passed) {
      player.solved = true;
      player.score += 100;
      const elapsed = room.timeLimitMin * 60 - room.secondsLeft;
      const m = Math.floor(elapsed / 60), s = elapsed % 60;
      player.solveTime = `${m}:${s.toString().padStart(2, '0')}`;
      io.to(code).emit('player_solved', {
        name: player.name, solveTime: player.solveTime,
        room: getRoomSummary(room)
      });
      // Check if all solved
      if (room.players.every(p => p.solved)) {
        clearInterval(room.timerInterval);
        room.status = 'finished';
        io.to(code).emit('battle_ended', { room: getRoomSummary(room) });
      }
    }
  });

  // Chat
  socket.on('chat_message', ({ code, message }) => {
    const user = users[socket.id];
    if (!user || !rooms[code]) return;
    io.to(code).emit('chat_message', { user: user.name, message, time: Date.now() });
  });

  // Leave room
  socket.on('leave_room', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.filter(p => p.socketId !== socket.id);
    socket.leave(code);
    if (room.players.length === 0) {
      clearInterval(room.timerInterval);
      delete rooms[code];
    } else {
      if (room.hostId === socket.id) room.hostId = room.players[0].socketId;
      io.to(code).emit('player_left', { room: getRoomSummary(room) });
    }
    io.emit('room_list', Object.values(rooms).map(getRoomSummary));
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      Object.keys(rooms).forEach(code => {
        const room = rooms[code];
        const idx = room.players.findIndex(p => p.socketId === socket.id);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          if (room.players.length === 0) {
            clearInterval(room.timerInterval);
            delete rooms[code];
          } else {
            if (room.hostId === socket.id) room.hostId = room.players[0].socketId;
            io.to(code).emit('player_left', { room: getRoomSummary(room) });
          }
        }
      });
      delete users[socket.id];
    }
    io.emit('room_list', Object.values(rooms).map(getRoomSummary));
    console.log('User disconnected:', socket.id);
  });
  socket.on('get_problem', ({ code }) => {
  const room = rooms[code];
  if (room) socket.emit('problem_data', room.problem);
});
});

// Health check
app.get('/', (req, res) => res.send('CodeBrawl server is running ✅'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 CodeBrawl server running on port ${PORT}`));
