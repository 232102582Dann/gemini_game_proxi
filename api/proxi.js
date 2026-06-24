export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    // 1. Ambil teks mentah dari Construct 2
    let rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // 2. DETEKSI PAKSA: Ambil teks apa pun yang ada di dalam parameter "text"
    // Cara ini bypass semua error tanda petik hancur di Construct 2
    let userPrompt = "Halo Gemini, berikan satu kalimat motivasi pendek!";
    const match = rawBody.match(/"text"\s*:\s*"*([^"\}]+)/);
    if (match && match[1]) {
        userPrompt = match[1].replace(/\\/g, '').trim();
    }

    // 3. Susun Payload Resmi Gemini
    const geminiPayload = {
      contents: [{
        parts: [{ text: userPrompt }]
      }]
    };

    // 4. Kirim ke Gemini
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });
    
    const data = await response.json();

    // 5. Jika API Key salah atau kuota habis, tangkap errornya
    if (data.error) {
       res.status(200).send(`{"text": "Error API: ${data.error.message}"}`);
       return;
    }

    // 6. Kembalikan data sesuai format tokenat kamu
    if (data && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
       const aiText = data.candidates[0].content.parts[0].text.replace(/"/g, "'").replace(/\n/g, " ");
       res.status(200).send(`{"text": "${aiText}"}`);
    } else {
       res.status(200).send(`{"text": "Gemini balik kosong, cek API Key di Vercel"}`);
    }

  } catch (error) {
    res.status(200).send(`{"text": "Server eror: ${error.message}"}`);
  }
}
