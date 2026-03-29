
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('C:\sanrafael360\san_rafael_businesses.xlsx')
    $sheet = $wb.Sheets.Item(1)
    for ($r = 1; $r -le 20; $r++) {
        $rowData = ""
        for ($c = 1; $c -le 25; $c++) {
            $val = $sheet.Cells.Item($r, $c).Value2
            if ($null -eq $val) {
                $rowData += "[EMPTY] | "
            } else {
                $rowData += "$val | "
            }
        }
        Write-Output $rowData
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
