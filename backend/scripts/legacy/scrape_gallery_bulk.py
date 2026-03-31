import requests
import os
import shutil
import re
import json
from urllib.parse import urljoin, urlparse

def is_valid_img(url):
    exts = ['.jpg', '.jpeg', '.png', '.webp']
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in exts)

def scrape():
    if not os.path.exists('listings_full_data.json'):
        print("Data file not found.")
        return

    with open('listings_full_data.json', 'r', encoding='utf-8') as f:
        listings = json.load(f)

    if not os.path.exists('galleries'):
        os.makedirs('galleries')

    processed_log = 'processed_galleries.log'
    processed_pids = set()
    if os.path.exists(processed_log):
        with open(processed_log, 'r') as f:
            processed_pids = set(line.strip() for line in f)

    for item in listings:
        pid = str(item['ID'])
        base_url = item['website']
        
        if pid in processed_pids:
            continue
            
        print(f"Scraping {pid}: {base_url}...")
        
        if not base_url or not base_url.startswith('http'):
            print(f"  Invalid URL skipped.")
            continue

        try:
            r = requests.get(base_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'}, verify=False)
            html = r.text
            
            pid_dir = f'galleries/{pid}'
            os.makedirs(pid_dir, exist_ok=True)
            
            # Simple regex for img src
            img_urls = re.findall(r'<img [^>]*src=["\']([^"\']+)["\']', html)
            img_urls += re.findall(r'<img [^>]*data-src=["\']([^"\']+)["\']', html)
            
            count = 0
            seen_urls = set()

            for src in img_urls:
                full_url = urljoin(base_url, src)
                if not is_valid_img(full_url) or full_url in seen_urls:
                    continue
                
                low_url = full_url.lower()
                if any(x in low_url for x in ['logo', 'icon', 'bg', 'header', 'footer', 'wp-content/themes', 'favicon', 'pixel', 'banner']):
                    continue

                try:
                    ir = requests.get(full_url, timeout=5, verify=False)
                    # Filter for decent sized images
                    if len(ir.content) < 50000: 
                        continue
                    
                    fname = f"{pid_dir}/img_{count}.jpg"
                    with open(fname, 'wb') as f:
                        f.write(ir.content)
                    
                    seen_urls.add(full_url)
                    count += 1
                    print(f"  Saved {full_url}")
                    
                    if count >= 3: # Let's stick with 3 for bulk
                        break
                except:
                    continue
            
            with open(processed_log, 'a') as plog:
                plog.write(f"{pid}\n")
                
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    scrape()
