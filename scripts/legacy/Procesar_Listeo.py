import pandas as pd
import re
import time
import requests
import html
import os
from geopy.geocoders import ArcGIS, Nominatim

def clean_phone(phone):
    if pd.isna(phone) or str(phone).strip() == "":
        return ""
    # Deja solo los números
    return re.sub(r'\D', '', str(phone))

def scrape_hotel_data(url):
    if not isinstance(url, str) or not url.startswith('http'):
        return None, None
    try:
        # User agent para evitar bloqueos
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            text = html.unescape(response.text)
            
            address = None
            phone = None
            
            # Buscar el contenido principal (ajustado para ser más flexible)
            content_match = re.search(r'class="entry-content clear".*?>(.*?)</div>', text, re.DOTALL)
            if not content_match:
                content_match = re.search(r'itemprop="text".*?>(.*?)</div>', text, re.DOTALL)
            
            if content_match:
                content = content_match.group(1)
                # El primer párrafo razonable suele ser la dirección
                p_matches = re.findall(r'<p>(.*?)</p>', content, re.DOTALL)
                for p in p_matches:
                    p_clean = re.sub(r'<[^>]+>', '', p).strip()
                    p_clean = p_clean.replace('\xa0', ' ').strip()
                    # Quitar ruidos pero preservar acentos y la palabra Teléfono
                    p_clean = re.sub(r'[^\w\s\.,\-–áéíóúÁÉÍÓÚñÑ]', ' ', p_clean).strip()
                    
                    if not p_clean:
                        continue
                        
                    # Si parece una dirección (contiene números y letras, no solo Teléfono)
                    if not address and len(p_clean) > 5 and not re.search(r'Tel[eé]fono', p_clean, re.IGNORECASE):
                        address = p_clean
                    
                    # Buscar teléfono (más flexible con lo que hay en medio)
                    phone_match = re.search(r'Tel[eé]fono.*?:?\s*([\d\s\-–]+)', p_clean, re.IGNORECASE)
                    if phone_match:
                        phone = phone_match.group(1).strip()
            
            return address, phone
    except Exception:
        pass
    return None, None

def safe_print(text):
    # Evita errores de encoding al imprimir en consola Windows
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', 'ignore').decode('ascii'))

def clean_html_entities(text):
    if not isinstance(text, str):
        return text
    # Eliminar caracter \ufffc (Object Replacement Character)
    text = text.replace('\ufffc', '')
    # Saneando entidades HTML comunes
    entities = {
        '&#8211;': '-', '&#8212;': '-', '&#038;': '&', '&amp;': '&',
        '&#039;': "'", '&quot;': '"', '&#8230;': '...', '&#160;': ' '
    }
    for ent, val in entities.items():
        text = text.replace(ent, val)
    return text

def clean_name_for_geo(name):
    # Remueve ruidos como "- X Estrellas", parentesis, etc.
    name = re.sub(r'[\u2013\u2014]', '-', name) 
    name = re.sub(r'\s*-\s*\d+\s*Estrella[s]*.*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\(.*\)', '', name)
    return name.strip()

def process_data(input_file, output_file, start_index=0):
    safe_print(f"Leyendo archivo: {input_file}")
    df = pd.read_excel(input_file, sheet_name='Anunciantes')
    
    # Filtrar filas donde el Nombre es nulo
    df = df[df['Nombre'].notna()]
    
    # Aplicar limpieza global de entidades HTML
    df = df.map(clean_html_entities)
    
    # Inicializar geocodificadores
    arcgis = ArcGIS(user_agent="sanrafael360_importer")
    nominatim = Nominatim(user_agent="sanrafael360_importer_v2")
    
    results = []
    # Si empezamos desde un offset, cargamos lo anterior si existe
    if start_index > 0 and os.path.exists(output_file):
        try:
            prev_df = pd.read_csv(output_file)
            results = prev_df.to_dict('records')
            safe_print(f"Cargados {len(results)} registros previos desde {output_file}")
        except Exception:
            pass

    total = len(df)
    safe_print(f"Iniciando procesamiento enriquecido desde registro {start_index+1} de {total}...")

    for i, row in df.iloc[start_index:].iterrows():
        nombre = str(row['Nombre'])
        direccion = str(row['Dirección']).strip() if pd.notna(row['Dirección']) else ""
        phone_source = row['WhatsApp'] if pd.notna(row['WhatsApp']) else row['Teléfono']
        link_ver_mas = row['Link Ver Más'] if pd.notna(row['Link Ver Más']) else ""
        
        # SI FALTAN DATOS CRÍTICOS, INTENTAMOS SCRAPEAR
        if (direccion.lower() == "es" or len(direccion) < 3 or pd.isna(phone_source)) and link_ver_mas:
            safe_print(f"[{i+1}/{total}] Datos incompletos para '{nombre}'. Intentando scrapear...")
            scraped_address, scraped_phone = scrape_hotel_data(link_ver_mas)
            if scraped_address:
                direccion = scraped_address
                safe_print(f"      Dirección encontrada: {direccion}")
            if scraped_phone and (pd.isna(phone_source) or str(phone_source).strip() == ""):
                phone_source = scraped_phone
                safe_print(f"      Teléfono encontrado: {phone_source}")
        
        # Limpieza final de dirección para geocodificación
        if direccion.lower() == "es" or len(direccion) < 3:
            direccion_geo = ""
        else:
            direccion_geo = direccion

        lat, lon = "", ""
        nombre_limpio = clean_name_for_geo(nombre)
        
        # PRIORIDAD 1: Nominatim con Dirección (es más preciso en calles específicas)
        if direccion_geo:
            try:
                query = f"{direccion_geo}, San Rafael, Mendoza, Argentina"
                location = nominatim.geocode(query, timeout=10)
                if location and "Mendoza" in location.address:
                    lat, lon = location.latitude, location.longitude
                    safe_print(f"[{i+1}/{total}] ENCONTRADO (Nominatim): {nombre} -> {lat}, {lon}")
            except Exception:
                pass

        # PRIORIDAD 2: ArcGIS (si Nominatim falló o no hay dirección específica)
        if not lat:
            queries_to_try = []
            if direccion_geo:
                queries_to_try.append(f"{nombre_limpio}, {direccion_geo}, San Rafael, Mendoza, Argentina")
            
            queries_to_try.append(f"{nombre_limpio}, San Rafael, Mendoza, Argentina")

            for query in queries_to_try:
                try:
                    location = arcgis.geocode(query, timeout=15)
                    if location:
                        lat, lon = location.latitude, location.longitude
                        # Si ArcGIS devuelve el centro de Rama Caída o Las Paredes, lo marcamos pero seguimos
                        is_fallback = lat in [-34.7012098, -34.611168, -34.56411]
                        safe_print(f"[{i+1}/{total}] ENCONTRADO (ArcGIS): {nombre} -> {lat}, {lon} {'(Centroid)' if is_fallback else ''}")
                        break
                    time.sleep(0.5) 
                except Exception as e:
                    safe_print(f"[{i+1}/{total}] Error ArcGIS: {e}")
                    time.sleep(0.5)
        
        if not lat:
            safe_print(f"[{i+1}/{total}] NO SE ENCONTRÓ UBICACIÓN: {nombre}")

        # Preparar data para el CSV
        phone_val = clean_phone(phone_source)
        
        results.append({
            'post_title': nombre,
            'listing_category': row['Categoría'],
            '_address': direccion if direccion.lower() != "es" else "",
            '_phone': phone_val,
            '_whatsapp': phone_val,
            '_email': row['Email'] if pd.notna(row['Email']) else "",
            '_website': row['Web'] if pd.notna(row['Web']) else "",
            '_instagram': row['Instagram'] if pd.notna(row['Instagram']) else "",
            '_facebook': row['Facebook'] if pd.notna(row['Facebook']) else "",
            '_thumbnail_id': row['Foto/Logo URL'] if pd.notna(row['Foto/Logo URL']) else "",
            '_gallery': row['Foto/Logo URL'] if pd.notna(row['Foto/Logo URL']) else "",
            '_geolocation_lat': lat,
            '_geolocation_long': lon,
            'post_content': f"{nombre} en San Rafael. Más información en: {row['Link Ver Más']}" if pd.notna(row['Link Ver Más']) and str(row['Link Ver Más']).strip() != "" else f"{nombre} en San Rafael."
        })

        # Autoguardado cada 20 registros
        if (i + 1) % 20 == 0:
            temp_df = pd.DataFrame(results)
            temp_df.to_csv(output_file, index=False, encoding='utf-8-sig')
            safe_print(f"--- Autoguardado progresivo ({i+1}/{total}) ---")

    # Exportar a CSV final
    listeo_df = pd.DataFrame(results)
    listeo_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    safe_print(f"\nProcesamiento completado. Archivo generado: '{output_file}'")

# Ejecución
if __name__ == "__main__":
    input_xlsx = 'san_rafael_businesses.xlsx'
    output_csv = 'importar_listeo_geocodificado.csv'
    # Empezar desde el 100 ya que los primeros están validados
    process_data(input_xlsx, output_csv, start_index=100)