import requests
import os
import shutil
import re
from urllib.parse import urljoin, urlparse

# Pilot listings
listings = {
    3326: 'https://www.riscoviajes.com/',
    3288: 'https://www.atueltravel.com.ar/',
    3290: 'https://almundo.com.ar/',
    3294: 'https://elcoyoteviajesyturismo.tur.ar/',
    3296: 'http://www.excursionesahora.com.ar/'
}

def is_valid_img(url):
    exts = ['.jpg', '.jpeg', '.png', '.webp']
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in exts)

def scrape():
    if os.path.exists('galleries'):
        shutil.rmtree('galleries')
    os.makedirs('galleries')

    for pid, base_url in listings.items():
        print(f"Scraping {pid}: {base_url}...")
        try:
            r = requests.get(base_url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'}, verify=False)
            html = r.text
            
            os.makedirs(f'galleries/{pid}', exist_ok=True)
            
            # Simple regex for img src
            img_urls = re.findall(r'<img [^>]*src=["\']([^"\']+)["\']', html)
            # Support data-src as well
            img_urls += re.findall(r'<img [^>]*data-src=["\']([^"\']+)["\']', html)
            
            count = 0
            seen_urls = set()

            for src in img_urls:
                full_url = urljoin(base_url, src)
                if not is_valid_img(full_url) or full_url in seen_urls:
                    continue
                
                low_url = full_url.lower()
                if any(x in low_url for x in ['logo', 'icon', 'bg', 'header', 'footer', 'wp-content/themes', 'favicon', 'pixel']):
                    continue

                try:
                    ir = requests.get(full_url, timeout=10, verify=False)
                    if len(ir.content) < 40000: # 40KB minimum
                        continue
                    
                    fname = f"galleries/{pid}/img_{count}.jpg"
                    with open(fname, 'wb') as f:
                        f.write(ir.content)
                    
                    seen_urls.add(full_url)
                    count += 1
                    print(f"  Saved {full_url}")
                    
                    if count >= 4:
                        break
                except:
                    continue
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    scrape()
