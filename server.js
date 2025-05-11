// server.js  – единый сервис «фронт + API»
require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');

const analyzeRoute = require('./routes/analyze');

const app = express();

/* ─ global middlewares ─ */
app.use(cors({ origin: '*' }));
app.use(express.json());

/* ─ API ─ */
app.use('/analyze', analyzeRoute);
app.use('/uploads', express.static('uploads'));

/* ─ FRONTEND ─ */
const frontDir = path.join(__dirname, 'frontend');   // 💡 ← сюда вы уже скопировали build
app.use(express.static(frontDir, {
  // главное – убрать заголовок, мешающий iframe
  setHeaders(res/*, path */) {
    res.removeHeader('X-Frame-Options');          // kill SAMEORIGIN
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // или конкретнее CSP
  }
}));

// fallback для SPA
app.get('*', (_, res) => res.sendFile(path.join(frontDir, 'index.html')));

/* ─ RUN ─ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔮 API слушает ${PORT}`));
