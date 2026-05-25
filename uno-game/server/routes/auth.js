const express         = require('express');
const passport        = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ─── Discord Strategy ─────────────────────────────────────────────────────────
passport.use(new DiscordStrategy(
  {
    clientID:     process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL:  process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/auth/discord/callback',
    scope:        ['identify'],
  },
  (accessToken, refreshToken, profile, done) => {
    const user = {
      id:            profile.id,
      username:      profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${Number(profile.id) % 5}.png`,
    };
    return done(null, user);
  },
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/discord', passport.authenticate('discord'));

router.get(
  '/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=auth`,
  }),
  (req, res) => {
    // Redirect back to wherever they were going (stored before auth)
    const dest = req.session.returnTo || `${process.env.CLIENT_URL || 'http://localhost:5173'}/lobby`;
    delete req.session.returnTo;
    res.redirect(dest);
  },
);

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.user);
});

// ─── Guest login ─────────────────────────────────────────────────────────────
router.post('/guest', (req, res, next) => {
  const raw = (req.body.username || '').trim().slice(0, 20);
  if (!raw) return res.status(400).json({ error: 'กรุณาใส่ชื่อ' });

  const guestUser = {
    id:       `guest_${uuidv4().slice(0, 8)}`,
    username: raw,
    avatar:   `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`,
    isGuest:  true,
  };

  req.login(guestUser, (err) => {
    if (err) return next(err);
    res.json(guestUser);
  });
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

module.exports = router;
