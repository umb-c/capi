import crypto from 'crypto';

export default async function handler(req, res) {
  const origin = 'https://lamape.eu';

  // ✅ CORS settings
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST ammesso' });

  try {
    // ✅ Lettura variabili dal body
    const {
      event_name = 'PageView',
      event_id,
      fbp,
      fbc,
      external_id,
      value,
      currency,
      content_ids,
      content_type,
      email,
      phone
    } = req.body;

    // ✅ Lettura variabili d'ambiente
    const token = process.env.META_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;

    console.log('🔍 ENV CHECK:', { token, pixelId });

    if (!token || !pixelId) {
      console.error('❌ Token o Pixel ID mancanti:', { token, pixelId });
      return res.status(500).json({ error: 'Configurazione Meta incompleta' });
    }

    // ✅ IP e User Agent
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';
    const sourceUrl = req.headers.referer || origin;

    // ✅ Funzione di hashing SHA256
    const hash = value =>
      typeof value === 'string' && value.trim()
        ? crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
        : undefined;

    // ✅ Costruzione payload
    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          event_source_url: sourceUrl,
          action_source: 'website',
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
            fbp,
            fbc,
            external_id,
            em: hash(email),
            ph: hash(phone)
          },
          custom_data: {
            value: value ?? 0,
            currency: currency ?? 'EUR',
            content_ids: Array.isArray(content_ids) ? content_ids : [],
            content_type: content_type ?? 'product'
          }
        }
      ]
    };

    console.log('📦 Payload pronto:', JSON.stringify(payload, null, 2));

    // ✅ Invio a Meta Conversion API
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Errore da Meta:', JSON.stringify(result, null, 2));
      return res.status(500).json({ error: 'Errore da Meta', details: result });
    }

    console.log('✅ Evento inviato correttamente:', result);
    res.status(200).json({ success: true, meta_response: result });
  } catch (error) {
    console.error('❌ Errore interno:', error.message);
    res.status(500).json({ error: 'Errore interno', details: error.message });
  }
}
