/**
 * /api/extract
 * Accepts multipart/form-data with field `image` (receipt/bank statement screenshot)
 * Uses Tesseract.js OCR to extract text, then parses lines into transactions
 * Transaction shape: { ts, amount, type, merchant, channel }
 */
import express from 'express'
import multer from 'multer'
import Tesseract from 'tesseract.js'
import sharp from 'sharp'
// Gemini removed: OCR-only pipeline

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Simple parsers
const ISO_TS = /(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/
const DATE_DMY = /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]20\d{2}\b)/i
const TIME_HM = /(\b\d{1,2}:\d{2}\b)/
const AMOUNT = /(?:₹|INR)?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/i

function tryParseLine(line) {
  // Expected formats (heuristic):
  // 1) 2025-10-01T10:00:00Z, 800.50, credit, Merchant, Card
  // 2) 2025-10-01 10:00, -800, debit, Merchant, UPI
  // 3) 01/10/2025 10:00 INR 800 CR Merchant UPI
  const parts = line.split(/\s*[|,]\s*/)
  if (parts.length >= 3) {
    let ts = parts[0].trim()
    if (!ts.endsWith('Z') && ts.match(/^20\d{2}-\d{2}-\d{2}\s+\d{2}:\d{2}/)) {
      // Convert "YYYY-MM-DD HH:MM" to ISO Z
      ts = ts.replace(' ', 'T') + ':00Z'
    }
    if (!ISO_TS.test(ts)) return null

    const amtRaw = parts[1].replace(/,/g, '').trim()
    const amtMatch = amtRaw.match(AMOUNT)
    if (!amtMatch) return null
    const amount = Math.abs(parseFloat(amtMatch[0]))

    let type = (parts[2] || '').toLowerCase().includes('credit') ? 'credit' : 'debit'
    const merchant = (parts[3] || 'Unknown').trim()
    const channel = (parts[4] || 'Card').trim()

    return { ts, amount, type, merchant, channel }
  }
  return null
}

function parseTextToTransactions(text) {
  const txns = []
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    // Try comma/pipe separated first
    const t1 = tryParseLine(line)
    if (t1) { txns.push(t1); continue }

    // Try space-separated heuristic with ISO ts present
    const tsMatch = line.match(ISO_TS)
    if (tsMatch) {
      const ts = tsMatch[1]
      // find amount near ts
      const after = line.slice(line.indexOf(ts) + ts.length)
      const amtMatch = after.match(AMOUNT)
      if (amtMatch) {
        const amount = Math.abs(parseFloat(amtMatch[0].replace(/,/g, '')))
        const type = /credit|cr\b/i.test(line) ? 'credit' : 'debit'
        const merchant = (line.replace(ts, '').replace(amtMatch[0], '').trim().split(/\s{2,}|,|\|/)[0] || 'Unknown')
        const channel = /upi/i.test(line) ? 'UPI' : (/card/i.test(line) ? 'Card' : 'Bank')
        txns.push({ ts, amount, type, merchant, channel })
      }
      continue
    }

    // dd/mm/yyyy with optional time and CR/DR
    const dmy = line.match(DATE_DMY)
    if (dmy) {
      let datePart = dmy[1]
      const hm = line.match(TIME_HM)?.[1] || '10:00'
      // Normalize to ISO Z
      const [d, m, y] = datePart.replace(/\-/g, '/').split('/')
      const ts = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${hm}:00Z`
      const amtMatch = line.match(AMOUNT)
      if (!amtMatch) continue
      const amt = Math.abs(parseFloat(amtMatch[1].replace(/,/g, '')))
      const type = /(credit|\bcr\b)/i.test(line) ? 'credit' : 'debit'
      const channel = /upi/i.test(line) ? 'UPI' : (/card/i.test(line) ? 'Card' : 'Bank')
      // Merchant heuristic: words between amount and channel keywords
      const cleaned = line
        .replace(datePart, '')
        .replace(hm, '')
        .replace(amtMatch[0], '')
        .replace(/\b(?:INR|CR|DR)\b/ig, '')
        .trim()
      const merchant = (cleaned.split(/\s{2,}|,|\|/).filter(Boolean)[0]) || 'Unknown'
      txns.push({ ts, amount: amt, type, merchant, channel })
      continue
    }
  }
  return txns
}

// Gemini integration removed

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded. Use field name "image".' })

    // Preprocess image: grayscale -> normalize -> threshold to improve OCR
    let processed
    try {
      processed = await sharp(req.file.buffer)
        .grayscale()
        .normalize()
        .threshold(150)
        .toFormat('png')
        .toBuffer()
    } catch (e) {
      // Fallback to original buffer
      processed = req.file.buffer
    }

    // Perform OCR
    const { data } = await Tesseract.recognize(processed, 'eng', {
      logger: () => {},
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:/-. INRcdr'
    })
    const text = data?.text || ''

    const transactions = parseTextToTransactions(text)
    if (!transactions.length) {
      return res.status(200).json({ transactions: [], ocr_text: text, message: 'No transactions detected. Edit manually if needed.' })
    }

    return res.json({ transactions, ocr_text: text, provider: 'tesseract' })
  } catch (err) {
    console.error('extract error', err)
    res.status(500).json({ message: 'Failed to extract transactions from image', error: err.message })
  }
})

export default router
