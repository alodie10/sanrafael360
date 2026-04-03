$GOOGLE_MAPS_KEY = "AIzaSyCj9Y8mPBuCSxW0O2LEgj8nokX9pSAewgA"

$cases = @(
    @{ name = "BODEGA ETNIA"; addr = "Domicilio   Cubillos 2225 – Los Andes 550" },
    @{ name = "Cabañas Del Sur- Rama Caída"; addr = "Ejército de Los Andes 550" }
)

foreach ($c in $cases) {
    $nombre = $c.name
    $cleanAddr = $c.addr # Simplified cleaning for debug
    
    Write-Host "--- TESTING: $nombre ---"
    
    # SEARCH 1: NAME ONLY
    $q1 = [System.Net.WebUtility]::UrlEncode("$nombre, San Rafael, Mendoza, Argentina")
    $res1 = Invoke-RestMethod -Uri "https://maps.googleapis.com/maps/api/geocode/json?address=$q1&key=$GOOGLE_MAPS_KEY"
    
    if ($res1.status -eq "OK") {
        $r = $res1.results[0]
        Write-Host "Search 1 (Name Only) STATUS: OK"
        Write-Host "  Address: $($r.formatted_address)"
        Write-Host "  Coords: $($r.geometry.location.lat), $($r.geometry.location.lng)"
        Write-Host "  Types: $($r.types -join ', ')"
        
        $isPlace = $false
        foreach ($type in $r.types) {
            if ($type -match "establishment|point_of_interest|lodging|restaurant|food|store|park|tourist_attraction") {
                $isPlace = $true
                break
            }
        }
        Write-Host "  IsPlace (calculated): $isPlace"
    } else {
        Write-Host "Search 1 STATUS: $($res1.status)"
    }
    
    Write-Host ""
}
