export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { channel, debug } = req.query;
  if (!channel) return res.status(400).json({ error: 'channel required' });

  try {
    const response = await fetch(`https://t.me/s/${channel}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    const html = await response.text();

    // 调试模式：直接返回原始 HTML 片段
    if (debug === '1') {
      return res.status(200).send(html.substring(0, 5000));
    }

    const items = [];

    // 匹配所有 https 开头的图片 URL
    const patterns = [
      /https:\/\/cdn[^"'\s)]+\.jpg/g,
      /https:\/\/cdn[^"'\s)]+\.jpeg/g,
      /https:\/\/cdn[^"'\s)]+\.webp/g,
      /url\('(https:\/\/[^']+)'\)/g,
      /"(https:\/\/cdn\.telegram[^"]+)"/g,
    ];

    patterns.forEach(regex => {
      let match;
      while ((match = regex.exec(html)) !== null) {
        const url = match[1] || match[0];
        if (!items.find(i => i.url === url)) {
          items.push({ type: 'photo', url });
        }
      }
    });

    const videoRegex = /<video[^>]+src="([^"]+)"/g;
    let match;
    while ((match = videoRegex.exec(html)) !== null) {
      items.push({ type: 'video', url: match[1] });
    }

    res.status(200).json({ items: items.slice(0, 20), total: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
