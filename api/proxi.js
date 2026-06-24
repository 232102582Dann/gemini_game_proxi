export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    // 1. Ambil data mentah yang dikirim oleh Construct 2
    let rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // 2. JINAKKAN BUG CONSTRUCT 2: Bersihkan double/triple quotes ("" atau """) menjadi satu tanda petik biasa (")
    // Ini mengubah text hancur dari image_6c4460.png menjadi JSON bersih yang valid
    let cleanBody = rawBody.replace(/""+/g, '"');

    // Jika ada sisa tanda petik di luar bungkus string akibat salah urutan parser, kita rapikan
    if (cleanBody.startsWith('"{\\"') || cleanBody.startsWith('"{')) {
        cleanBody = cleanBody.replace(/^"/, '').replace(/"$/, '');
    }

    // 3. Kirim ke API Gemini
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: cleanBody
    });
    
    const data = await response.json();

    // 4. SESUAIKAN DENGAN TOKENAT DI IMAGE_6C4460.PNG
    // Rumus tokenat kamu di Event 10 mencari teks: ""text"": ""
    // Agar tokenat kamu yang hancur itu berhasil membaca, kita paksa Vercel mengembalikan format teks mentah yang sesuai!
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
       const aiText = data.candidates[0].content.parts[0].text;
       // Format balikan ini dibuat sengaja agar umpan tokenat(..., 1, '""text"": ""') milikmu sukses memotong string
       res.status(200).send(`{"text": "${aiText}"}`);
    } else {
       res.status(200).send(`{"text": "Gagal mengambil data dari AI"}`);
    }

  } catch (error) {
    res.status(500).json({ error: "Gagal menghubungkan ke Gemini" });
  }
}
