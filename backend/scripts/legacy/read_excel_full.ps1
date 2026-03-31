
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('C:\sanrafael360\san_rafael_businesses.xlsx')
    $sheet = $wb.Sheets.Item(1)
    # Read headers
    $headers = ""
    for ($c = 1; $c -le 50; $c++) {
        $val = $sheet.Cells.Item(1, $c).Value2
        if ($null -eq $val) { $headers += "COL $c - [EMPTY] | " }
        else { $headers += "COL $c - $val | " }
    }
    Write-Output "HEADERS: $headers"
    
    # Read first 5 data rows
    for ($r = 2; $r -le 6; $r++) {
        $rowData = "ROW $r - "
        for ($c = 1; $c -le 50; $c++) {
            $val = $sheet.Cells.Item($r, $c).Value2
            if ($null -eq $val) { $rowData += "[EMPTY] | " }
            else { $rowData += "$val | " }
        }
        Write-Output $rowData
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
