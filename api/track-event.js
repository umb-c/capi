export default async function handler(req, res) {
  // CORS settings
  res.setHeader('Access-Control-Allow-Origin', 'https://lamape.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST ammesso' });

  try {
    const { event_id, fbp, fbc, external_id } = req.body;

    // IP e User Agent per Meta CAPI
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';

    // Costruzione payload per Meta
    const payload = {
      data: [
        {
          event_name: "PageView", // Puoi cambiare in "Purchase", "AddToCart", ecc.
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id,
          event_source_url: req.headers.referer || 'https://lamape.eu',
          action_source: "website",
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
            fbp: fbp,
            fbc: fbc,
            external_id: external_id
          }
        }
      ]
    };

    console.log("✅ Payload inviato a Meta:", JSON.stringify(payload, null, 2));

    const token = process.env.METAL_ACCESS_TOKEN;
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

    if (!response.ok) {
      console.error("❌ Errore da Meta:", result);
      return res.status(500).json({ error: 'Errore da Meta', details: result });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Errore interno:", error.message);
    res.status(500).json({ error: 'Errore interno', details: error.message });
  }
}
