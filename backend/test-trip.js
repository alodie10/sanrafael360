async function syncTripAdvisor(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const html = await res.text();

    const jsonLdRegex = /"aggregateRating"\s*:\s*\{[^}]+\}/i;
    const match = html.match(jsonLdRegex);
    
    let rating = 0;
    let reviewCount = 0;

    if (match) {
      console.log("Found JSON-LD match:", match[0]);
      const block = match[0];
      const ratingMatch = block.match(/"ratingValue"\s*:\s*"([^"]+)"/i) || block.match(/"ratingValue"\s*:\s*(\d+\.?\d*)/i);
      const countMatch = block.match(/"reviewCount"\s*:\s*"([^"]+)"/i) || block.match(/"reviewCount"\s*:\s*(\d+)/i);
      
      if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
      if (countMatch) reviewCount = parseInt(countMatch[1]);
    } else {
      console.log("No JSON-LD, trying fallbacks...");
      const bubbleMatch = html.match(/bubble_(\d+)/i);
      if (bubbleMatch) {
        rating = parseInt(bubbleMatch[1]) / 10;
      }
      
      const scoreMatch = html.match(/(\d[\.,]\d)\s+de\s+5/i) || html.match(/(\d)\s+de\s+5/i);
      if (scoreMatch && !rating) {
        rating = parseFloat(scoreMatch[1].replace(',', '.'));
      }
      
      const reviewsCountMatch = html.match(/(\d+[\.\s]?\d*)\s+opiniones/i) || html.match(/(\d+[\.\s]?\d*)\s+opinión/i) || html.match(/(\d+[\.\s]?\d*)\s+reviews/i);
      if (reviewsCountMatch) {
        reviewCount = parseInt(reviewsCountMatch[1].replace(/[\.\s]/g, ''));
      }
    }

    return { success: true, rating, reviewCount };
  } catch (err) {
    console.error(`Error:`, err.message);
    return { success: false, error: err.message };
  }
}

syncTripAdvisor("https://www.tripadvisor.com.ar/Restaurant_Review-g312781-d25064560-Reviews-El_Viejo_Bodegon-San_Rafael_Province_of_Mendoza_Cuyo.html").then(console.log);
