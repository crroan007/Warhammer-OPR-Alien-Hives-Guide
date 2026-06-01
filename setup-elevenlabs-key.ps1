# One-time: store your ElevenLabs API key locally for the narration generator.
# Input is hidden, the key is never echoed, and it's written to a gitignored .env.
$sec = Read-Host -AsSecureString "Paste your ElevenLabs API key (input is hidden)"
$plain = [System.Net.NetworkCredential]::new('', $sec).Password
if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Host "No key entered — aborted." -ForegroundColor Yellow
    exit 1
}
$envPath = Join-Path $PSScriptRoot "guide-video\.env"
Set-Content -Path $envPath -Value "ELEVENLABS_API_KEY=$plain" -Encoding ascii -NoNewline
$plain = $null
Write-Host "Saved to guide-video\.env (gitignored, not echoed)." -ForegroundColor Green
Write-Host "Now tell Claude: 'key is set' and I'll generate the narration + re-render."
