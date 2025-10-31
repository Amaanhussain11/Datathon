/**
 * /api/extract (Gemini-only)
 * Accepts multipart/form-data with field `image`. Uses Google Gemini to extract raw text from image.
 * Response: { ocr_text: string, provider: 'gemini', model_used: string }
 */
import express from 'express'
import multer from 'multer'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Defaults and helpers (mirrors the reference approach)
const DEFAULT_MODEL = 'gemini-2.5-flash'
const MODEL_NAME = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim()

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const err = new Error('Missing GEMINI_API_KEY in environment')
    err.status = 500
    throw err
  }
  return new GoogleGenerativeAI(apiKey)
}

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded. Use field name "image".' })

    const genAI = getClient()
    const b64 = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype || 'image/png'
    // Ask Gemini to return a strict JSON payload of transactions our app understands
    const schema = {
      transactions: [
        {
          ts: 'YYYY-MM-DDTHH:MM:SSZ',
          amount: 0,
          type: 'credit|debit',
          merchant: 'string',
          channel: 'UPI|Card|Bank|Cash|Bank'
        }
      ]
    }
    const prompt = `Extract bank/UPI statement transactions from the image and return ONLY strict JSON matching this schema: ${JSON.stringify(schema)}.\nRules:\n- ts MUST be ISO8601 like 2025-10-16T12:00:00Z (assume 10:00 if time not present).\n- amount is a number (absolute value).\n- type is 'credit' (money in) or 'debit' (money out).\n- channel one of UPI|Card|Bank|Cash.\n- If a field is unknown, make a best-effort guess; do not add extra fields.\nReturn ONLY JSON — no markdown or prose.`
    const contents = [
      { role: 'user', parts: [ { text: prompt }, { inlineData: { mimeType, data: b64 } } ] }
    ]

    // Fallback model list similar to the reference
    const fallbacks = [
      MODEL_NAME,
      DEFAULT_MODEL,
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b-latest',
      'gemini-1.5-flash-8b'
    ]
    const tried = new Set()
    let text = ''
    let usedModel = ''
    let rawText = ''
    let lastErr = null

    for (const name of fallbacks) {
      if (tried.has(name)) continue
      tried.add(name)
      try {
        const model = genAI.getGenerativeModel({ model: name })
        const result = await model.generateContent({ contents, generationConfig: { temperature: 0, maxOutputTokens: 2048 } })
        rawText = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('\n') || ''
        text = rawText
        if (text) { usedModel = name; break }
      } catch (e) {
        lastErr = e
        const msg = String(e?.message || e)
        // Continue on model not found/unsupported
        if (/not found|404|unsupported|Unexpected model name/i.test(msg)) continue
        throw e
      }
    }

    if (!text) {
      const attempted = Array.from(tried).join(', ')
      const err = lastErr || new Error(`Failed to get response from Gemini. Attempted models: ${attempted}`)
      err.attemptedModels = Array.from(tried)
      return res.status(502).json({ message: err.message, attemptedModels: err.attemptedModels })
    }

    // Try to parse strict JSON; handle possible code fences
    let jsonObj = null
    try {
      const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
      jsonObj = JSON.parse(cleaned)
    } catch (_) {
      try {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1) jsonObj = JSON.parse(text.slice(start, end + 1))
      } catch (_) {}
    }

    if (!jsonObj || !Array.isArray(jsonObj.transactions)) {
      // Return the raw text so the client can show it and allow manual edit
      return res.status(200).json({ transactions: [], ocr_text: rawText || text, provider: 'gemini', model_used: usedModel, message: 'No transactions detected. Edit manually if needed.' })
    }

    return res.json({ transactions: jsonObj.transactions, ocr_text: rawText, provider: 'gemini', model_used: usedModel })
  } catch (err) {
    const status = err?.status || err?.response?.status || 500
    const message = err?.response?.data?.error?.message || err?.message || 'Failed to extract text from image'
    console.error('extract error (gemini)', message)
    res.status(status).json({ message })
  }
})

export default router
