for ($o = 10; $o -lt 368; $o += 50) {
    Write-Output "Running batch starting at offset $o..."
    .\plink.exe -P 65002 -pw DcaDca_0111# u269831255@153.92.220.132 "cd domains/sanrafael360.com/public_html && export IMPORT_OFFSET=$o && export IMPORT_LIMIT=50 && wp eval-file import_businesses.php"
}
