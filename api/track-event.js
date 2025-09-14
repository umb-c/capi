export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://lamape.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo POST ammesso
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST ammesso' });
  }

  try {
    const payload = req.body;

    // Validazione base
    if (!payload?.data?.length) {
      return res.status(400).json({ error: 'Payload mancante o vuoto' });
    }

    // IP client (primo IP se lista)
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (payload.data[0].user_data) {
      payload.data[0].user_data.client_ip_address = ip;
    }

    // Logging utile per debug
    console.log('Payload ricevuto:', JSON.stringify(payload, null, 2));

    // Invio a Meta Conversions API
    const token = 'EAAV26VsK3EQBPa0Drvf1ejfLBluDKhpo9jntTW2nQdTWASp0cZBunxjlJpCp6GGZCnywTFB8KsZCRBcudbC4YtnXiccWirKZA3voHEblZA7rfERSTjg9t6ETNtGO1COaL1fhnxR5Wu9jfFdD3AKZCfTxwZB2i6OhSOIbBH163TYKCfrrbRGsyJDmHIrINxzw3zdzwKXBAZDZD';
    const pixelId = '302534569613426';
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    // Logging errore Meta
    if (!response.ok) {
      console.error('Errore da Meta:', result);
      return res.status(500).json({ error: 'Errore da Meta', details: result });
    }

    // Risposta OK
    res.status(200).json(result);
  } catch (error) {
    console.error('Errore interno:', error.message);
    res.status(500).json({ error: 'Errore interno', details: error.message });
  }
}
