$path = "C:\ProgramData\ssh\sshd_config"
$content = Get-Content $path -Raw
$content = $content -replace 'Match Group administrators', '#Match Group administrators'
$content = $content -replace '(\s+AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys)', '#$1'
Set-Content -Path $path -Value $content -Encoding utf8
Restart-Service sshd
Write-Host "==========================================" -ForegroundColor Green
Write-Host "BERHASIL: 2 baris sshd_config sudah dimatikan (#) & service sshd sudah direstart!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
