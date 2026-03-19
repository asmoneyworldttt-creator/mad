$path = "d:\live p\medpro\src\components\views\PatientOverview.tsx"
$content = [System.IO.File]::ReadAllText($path)

if ($content -match 'downloadInvoicePDF,') {
    $content = $content -replace 'downloadInvoicePDF,', "downloadInvoicePDF, `r`n    downloadDentalCertificatePDF,"
    [System.IO.File]::WriteAllText($path, $content)
    Write-Output "Success"
} else {
    Write-Output "Not Found"
}
