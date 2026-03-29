$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('C:\sanrafael360\san_rafael_businesses.xlsx')
    $sheet = $wb.Sheets.Item(1)
    $lastRow = $sheet.UsedRange.Rows.Count
    $data = @()

    $mapping = @{
        "Hoteles" = 32
        "Apart Hoteles" = 32
        "Cabañas" = 32
        "Hostels" = 32
        "Posadas" = 32
        "Bodegas" = 110
        "Gastronomía" = 22
        "Agencias de Viaje" = 36
    }

    for ($r = 2; $r -le $lastRow; $r++) {
        $catStr = $sheet.Cells.Item($r, 1).Value2
        $name = $sheet.Cells.Item($r, 2).Value2
        $desc = $sheet.Cells.Item($r, 3).Value2
        $phone = $sheet.Cells.Item($r, 4).Value2
        $whatsapp = $sheet.Cells.Item($r, 5).Value2
        $address = $sheet.Cells.Item($r, 6).Value2
        $facebook = $sheet.Cells.Item($r, 7).Value2
        $instagram = $sheet.Cells.Item($r, 8).Value2
        $web = $sheet.Cells.Item($r, 9).Value2
        $sourceUrl = $sheet.Cells.Item($r, 10).Value2
        $imageUrl = $sheet.Cells.Item($r, 11).Value2

        if ($null -eq $name) { continue }

        $catId = if ($mapping.ContainsKey($catStr)) { $mapping[$catStr] } else { 38 } # Default to 'Otros' (38)

        $item = @{
            category_id = $catId
            category_name = $catStr
            name = $name
            description = $desc
            phone = $phone
            whatsapp = $whatsapp
            address = $address
            facebook = $facebook
            instagram = $instagram
            website = $web
            source_url = $sourceUrl
            image_url = $imageUrl
        }
        $data += $item
    }

    $data | ConvertTo-Json -Depth 5 | Out-File -FilePath 'C:\sanrafael360\businesses.json' -Encoding utf8
    Write-Output "Successfully exported $($data.Count) businesses to businesses.json"
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
