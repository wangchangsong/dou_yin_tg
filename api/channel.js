export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { channel } = req.query;
  if (!channel) return res.status(400).json({ error: 'channel required' });

  try {
    const response = await fetch(`https://t.me/s/${channel}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    const items = [];

    const imgRegex = /background-image:url\('([^']+)'\)/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1].includes('cdn') || match[1].includes('telegram')) {
        items.push({ type: 'photo', url: match[1] });
      }
    }

    const videoRegex = /<video[^>]+src="([^"]+)"/g;
    while ((match = videoRegex.exec(html)) !== null) {
      items.push({ type: 'video', url: match[1] });
    }

    res.status(200).json({ items: items.slice(0, 20) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
