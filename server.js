const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.post('/track-event', async (req, res) => {
  const payload = req.body;

  // Aggiungi IP lato server
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  payload.data[0].user_data.client_ip_address = ip;

  const response = await fetch('https://graph.facebook.com/v18.0/302534569613426/events?access_token=EAAV26VsK3EQBPa0Drvf1ejfLBluDKhpo9jntTW2nQdTWASp0cZBunxjlJpCp6GGZCnywTFB8KsZCRBcudbC4YtnXiccWirKZA3voHEblZA7rfERSTjg9t6ETNtGO1COaL1fhnxR5Wu9jfFdD3AKZCfTxwZB2i6OhSOIbBH163TYKCfrrbRGsyJDmHIrINxzw3zdzwKXBAZDZD', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  res.json(result);
});

app.listen(3000, () => console.log('✅ Proxy attivo'));
