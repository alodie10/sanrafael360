$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('C:\sanrafael360\san_rafael_businesses.xlsx')
    $sheet = $wb.Sheets.Item(1)
    $lastRow = $sheet.UsedRange.Rows.Count
    $categories = @{}
    for ($r = 2; $r -le $lastRow; $r++) {
        $cat = $sheet.Cells.Item($r, 1).Value2
        if ($null -ne $cat) {
            $categories[$cat] = $true
        }
    }
    $categories.Keys | Sort-Object | ForEach-Object { Write-Output $_ }
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
