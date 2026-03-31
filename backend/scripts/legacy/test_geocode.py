from geopy.geocoders import Nominatim
import time

geolocator = Nominatim(user_agent="sanrafael360_tester")

queries = [
    "Hotel Kalton - 3 Estrellas, San Rafael, Mendoza, Argentina",
    "Hotel Kalton, San Rafael, Mendoza, Argentina",
    "Belgrano 1, San Rafael, Mendoza, Argentina", # Supongamos una dirección cercana
    "Hotel Kalton, San Rafael, Argentina"
]

for q in queries:
    try:
        print(f"Buscando: {q}")
        location = geolocator.geocode(q, timeout=10)
        if location:
            print(f"  ENCONTRADO: {location.latitude}, {location.longitude} | {location.address}")
        else:
            print("  NO ENCONTRADO")
        time.sleep(1.1)
    except Exception as e:
        print(f"  ERROR: {e}")
