$path = "d:\live p\medpro\src\components\views\QuickBills.tsx"
$content = [System.IO.File]::ReadAllText($path)

$old = '<button onClick=\{\(\) => handleDownloadInvoice\(b\)\}\s*className="p-2\.5 rounded-xl border transition-all hover:scale-105 shadow-sm"\s*style=\{\{\s*background:\s*''var\(--primary-soft\)''[\s\S]*?<Download size=\{18\} \/>\s*<\/button>'

$new = '<div className="flex items-center gap-2">
                                                <button onClick={() => handleDownloadInvoice(b)} title="Download Invoice" className="p-2.5 rounded-xl border transition-all hover:scale-105 shadow-sm" style={{ background: "var(--primary-soft)", borderColor: "var(--border-color)", color: "var(--primary)" }}>
                                                    <Download size={16} />
                                                </button>
                                                {b.notes?.includes("[Certificate]: true") && (
                                                    <button onClick={() => handleDownloadCertificateFromHistory(b)} title="Download Certificate" className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:scale-105 transition-all">
                                                        <FileText size={16} />
                                                    </button>
                                                )}
                                            </div>'

if ($content -match $old) {
    $content = $content -replace $old, $new
    [System.IO.File]::WriteAllText($path, $content)
    Write-Output "Success"
} else {
    Write-Output "Not Found"
}
