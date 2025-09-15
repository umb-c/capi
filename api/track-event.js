{%- comment -%}
  Script avanzato per generare fbc, fbp, external_id e inviarli con event_id per deduplicazione Meta
{%- endcomment -%}

<script>
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  const debug = urlParams.get('debug_capi') === 'true';

  // 🔍 Funzione per leggere i cookie
  const getCookie = name => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  };

  // ✅ Genera _fbc se fbclid è presente e il cookie non esiste
  if (fbclid && !getCookie('_fbc')) {
    const fbcValue = 'fb.1.' + Date.now() + '.' + fbclid;
    document.cookie = '_fbc=' + fbcValue + '; path=/; domain=' + window.location.hostname + ';';
    localStorage.setItem('fbclid', fbclid); // persistente
  }

  // ✅ Genera external_id persistente
  let externalId = localStorage.getItem('external_id');
  if (!externalId) {
    externalId = 'guest-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('external_id', externalId);
  }

  // ✅ Leggi i cookie
  const fbp = getCookie('_fbp') || '';
  const fbc = getCookie('_fbc') || '';
  const eventId = 'ev-' + Date.now();

  // ✅ Costruisci il payload
  const payload = {
    event_name: 'Purchase', // puoi cambiarlo dinamicamente
    event_id: eventId,
    fbp,
    fbc,
    external_id: externalId,
    value: 49.99, // dinamico
    currency: 'EUR',
    content_ids: ['SKU123'], // dinamico
    content_type: 'product',
    email: '', // opzionale
    phone: ''  // opzionale
  };

  if (debug) console.log('📦 Payload inviato a server:', payload);

  // ✅ Invia al server
  fetch('https://capi-snowy.vercel.app/api/track-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (debug) console.log('✅ Risposta Meta:', data);
    })
    .catch(err => console.error('❌ Errore invio evento:', err));
});
</script>
