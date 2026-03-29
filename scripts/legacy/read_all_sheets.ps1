
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('C:\sanrafael360\san_rafael_businesses.xlsx')
    Write-Output "Sheets: $($wb.Sheets.Count)"
    for ($i = 1; $i -le $wb.Sheets.Count; $i++) {
        $sheet = $wb.Sheets.Item($i)
        $sname = $sheet.Name
        Write-Output "Sheet ${i}: ${sname}"
        # Read first row (headers)
        $h = ""
        for ($c = 1; $c -le 50; $c++) {
            $v = $sheet.Cells.Item(1, $c).Value2
            if ($null -eq $v) { $v = "[EMPTY]" }
            $h += "C${c}: $v | "
        }
        Write-Output "Headers ${i}: $h"
        
        # Read second row (data)
        $d = ""
        for ($c = 1; $c -le 50; $c++) {
            $v = $sheet.Cells.Item(2, $c).Value2
            if ($null -eq $v) { $v = "[EMPTY]" }
            $d += "C${c}: $v | "
        }
        Write-Output "Data ${i}: $d"
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
}
