// routes/analyze.js

require('dotenv').config(); // загружаем .env до всего
const express    = require('express');
const multer     = require('multer');
const fs         = require('fs');
const path       = require('path');
const { OpenAI } = require('openai');

const {
  MODEL_ID,
  SYSTEM_BASE,
  STYLES,
  USER_TEMPLATE
} = require('../config/prompts');

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // ограничение до 10 MB, опционально
});

// инициализируем OpenAI с прокси-URL из .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseOptions: {
    baseURL: process.env.OPENAI_API_BASE_URL // теперь всё к OpenAI идёт через Cloudflare Worker
  }
});

router.post('/', upload.single('handImage'), async (req, res) => {
  try {
    const style   = req.body.style || 'ted';
    const imgPath = req.file?.path;
    if (!imgPath) {
      return res.status(400).json({ error: 'Файл не получен' });
    }

    // читаем файл и кодируем в base64
    const img64 = fs.readFileSync(imgPath, 'base64');
    console.log('📸', imgPath, 'base64 length:', img64.length);

    // готовим промпты
    const systemPrompt = SYSTEM_BASE + '\n' + (STYLES[style] ?? '');
    const userPrompt   = USER_TEMPLATE;

    // отправляем картинку в GPT-4 Vision через прокси
    const chat = await openai.chat.completions.create({
      model: MODEL_ID,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url   : `data:image/jpeg;base64,${img64}`,
                detail: 'low'
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    });

    const result = chat.choices?.[0]?.message?.content || '';
    console.log(
      '📄 result length:', result.length,
      '💰 tokens used:', chat.usage?.total_tokens
    );

    res.json({ result });

  } catch (err) {
    console.error('❌ Ошибка в analyze:', err.response?.data || err.message);
    res.status(500).json({ error: 'Ошибка анализа изображения' });
  } finally {
    // удаляем временный файл
    if (req.file?.path) {
      fs.rm(req.file.path, { force: true }, () => {});
    }
  }
});

module.exports = router;
