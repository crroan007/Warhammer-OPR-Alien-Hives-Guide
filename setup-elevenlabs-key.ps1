$sec = Read-Host -AsSecureString 'Paste your ElevenLabs API key then press Enter - input is hidden'
$plain = [System.Net.NetworkCredential]::new('', $sec).Password
if ([string]::IsNullOrWhiteSpace($plain)) { Write-Host 'No key entered. Aborted.'; exit 1 }
$envPath = Join-Path $PSScriptRoot 'guide-video\.env'
Set-Content -Path $envPath -Value "ELEVENLABS_API_KEY=$plain" -Encoding ascii -NoNewline
$plain = $null
Write-Host 'Saved to guide-video/.env - gitignored and not echoed.'
Write-Host 'Now tell Claude: key is set'
