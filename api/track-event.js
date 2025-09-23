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
    // ✅ Lettura variabili d'ambiente
    const token = process.env.META_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;

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

    // ✅ Riconoscimento webhook Shopify
    const isShopifyWebhook = req.headers['x-shopify-topic'] === 'orders/create';
    const order = isShopifyWebhook ? req.body : null;

    // ✅ Lettura variabili dal body (client-side o webhook)
    const {
      event_name = isShopifyWebhook ? 'Purchase' : 'PageView',
      event_id = isShopifyWebhook ? `purchase-${order?.id}` : undefined,
      fbp,
      fbc,
      external_id,
      value = isShopifyWebhook ? parseFloat(order?.total_price) : 0,
      currency = isShopifyWebhook ? order?.currency : 'EUR',
      content_ids = isShopifyWebhook ? order?.line_items?.map(item => item.product_id) : [],
      content_type = 'product',
      email = isShopifyWebhook ? order?.email : req.body.email,
      phone = isShopifyWebhook ? order?.phone : req.body.phone
    } = req.body;

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          event_source_url: isShopifyWebhook ? order?.order_status_url : sourceUrl,
          action_source: 'website',
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
            fbp,
            fbc,
            external_id,
            em: hash(email),
            ph: hash(phone),
            fn: hash(order?.customer?.first_name),
            ln: hash(order?.customer?.last_name),
            ct: hash(order?.billing_address?.city),
            zip: hash(order?.billing_address?.zip)
          },
          custom_data: {
            value,
            currency,
            content_ids: Array.isArray(content_ids) ? content_ids : [],
            content_type
          }
        }
      ]
    };

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
