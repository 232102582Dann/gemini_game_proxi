export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // === TRIK KHUSUS CONSTRUCT 2 ===
  let bodyData = req.body;
  
  // Jika Construct 2 mengirim data dalam bentuk objek formulir
  if (typeof bodyData === 'object' && Object.keys(bodyData).length > 0 && Object.values(bodyData)[0] === '') {
    try {
      // Ambil key pertamanya (string JSON mentah) lalu parse ulang menjadi objek bersih
      bodyData = JSON.parse(Object.keys(bodyData)[0]);
    } catch (e) {
      // Jika gagal parse, biarkan apa adanya
    }
  }
  // ===============================

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData) // Menggunakan bodyData yang sudah dibersihkan
    });
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal" });
  }
}
