export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://lamape.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Risposta alla preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo POST ammesso
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST ammesso' });
  }

  try {
    const payload = req.body;

    // Recupero IP dal client
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Inserimento IP nel payload se presente user_data
    if (payload?.data?.[0]?.user_data) {
      payload.data[0].user_data.client_ip_address = ip;
    }

    // Invio a Meta Conversions API
    const response = await fetch(
      'https://graph.facebook.com/v18.0/302534569613426/events?access_token=EAAV26VsK3EQBPa0Drvf1ejfLBluDKhpo9jntTW2nQdTWASp0cZBunxjlJpCp6GGZCnywTFB8KsZCRBcudbC4YtnXiccWirKZA3voHEblZA7rfERSTjg9t6ETNtGO1COaL1fhnxR5Wu9jfFdD3AKZCfTxwZB2i6OhSOIbBH163TYKCfrrbRGsyJDmHIrINxzw3zdzwKXBAZDZD',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Errore interno', details: error.message });
  }
}
