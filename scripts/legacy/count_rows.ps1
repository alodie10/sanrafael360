$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('C:\sanrafael360\san_rafael_businesses.xlsx')
    $sheet = $wb.Sheets.Item(1)
    $count = $sheet.UsedRange.Rows.Count
    Write-Output $count
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
