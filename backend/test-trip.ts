async function syncTripAdvisor(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    console.log("Status:", res.status);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const html = await res.text();

    const jsonLdRegex = /"aggregateRating"\s*:\s*\{[^}]+\}/i;
    const match = html.match(jsonLdRegex);
    console.log("JSON-LD Match:", match ? "Found" : "Not Found");
    let rating = 0;
    let reviewCount = 0;

    if (match) {
      const block = match[0];
      const ratingMatch = block.match(/"ratingValue"\s*:\s*"([^"]+)"/i) || block.match(/"ratingValue"\s*:\s*(\d+\.?\d*)/i);
      const countMatch = block.match(/"reviewCount"\s*:\s*"([^"]+)"/i) || block.match(/"reviewCount"\s*:\s*(\d+)/i);
      
      if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
      if (countMatch) reviewCount = parseInt(countMatch[1]);
    } else {
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
  } catch (err: any) {
    console.error(`[TripAdvisor Scraper] Error scraping ${url}:`, err.message);
    return { success: false, error: err.message };
  }
}
syncTripAdvisor("https://www.tripadvisor.com.ar/Restaurant_Review-g312782-d13840074-Reviews-Quinchos_de_Ortubia-San_Rafael_Province_of_Mendoza_Cuyo.html").then(console.log);
