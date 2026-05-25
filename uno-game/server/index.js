require('dotenv').config();
const express    = require('express');
const http       = require('http');
const path       = require('path');
const { Server } = require('socket.io');
const session    = require('express-session');
const passport   = require('passport');
const cors       = require('cors');

const isProd = process.env.NODE_ENV === 'production';

const authRouter  = require('./routes/auth');
const roomsRouter = require('./routes/rooms');
const { initSocket } = require('./socket/gameSocket');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: isProd ? false : {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
if (!isProd) {
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
}
app.use(express.json());

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, sameSite: isProd ? 'none' : 'lax' },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// ─── Share session with Socket.io ─────────────────────────────────────────────
const wrap = (mid) => (socket, next) => mid(socket.request, socket.request.res || {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/api/rooms', roomsRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

// ─── Serve React build (production) ──────────────────────────────────────────
if (isProd) {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  // SPA fallback — React Router handles the rest
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocket(io);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎴 UNO Server  →  http://localhost:${PORT}`);
  console.log(`🔗 OAuth callback: ${process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/auth/discord/callback'}`);
});
