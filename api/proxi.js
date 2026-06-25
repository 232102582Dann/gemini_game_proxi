export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  // UPDATE: Menggunakan endpoint v1 dan model gemini-2.5-flash terbaru
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    // 1. Ambil teks mentah dari Construct 2
    let rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // 2. DETEKSI PAKSA: Ambil teks di dalam parameter "text" dengan regex yang lebih aman
    let userPrompt = "Halo Gemini, berikan satu kalimat motivasi pendek!";
    const match = rawBody.match(/"text"\s*:\s*["\s]*([^"}]+)/);
    if (match && match[1]) {
        // Bersihkan sisa-sisa tanda petik ganda bawaan Construct 2
        userPrompt = match[1].replace(/"/g, '').replace(/\\/g, '').trim();
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

    // 5. Jika API Key bermasalah, kirim pesan ringkas yang tidak akan kepotong tokenat
    if (data.error) {
       console.error("Gemini Error:", data.error);
       res.status(200).send(`{"text": "Eror: API Key Vercel bermasalah atau model expired"}`);
       return;
    }

    // 6. Kembalikan data sesuai format tokenat kamu
    if (data && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
       const aiText = data.candidates[0].content.parts[0].text.replace(/"/g, "'").replace(/\n/g, " ");
       res.status(200).send(`{"text": "${aiText}"}`);
    } else {
       res.status(200).send(`{"text": "Eror: Respon Gemini kosong"}`);
    }

  } catch (error) {
    res.status(200).send(`{"text": "Eror: Masalah pada server proxy"}`);
  }
}
