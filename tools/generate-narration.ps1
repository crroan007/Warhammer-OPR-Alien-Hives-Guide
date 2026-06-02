<#
  Interactive ElevenLabs narration generator for the NPC Narrator.
  Just run it and paste each field when prompted:
    1. API key  — input is HIDDEN as you paste (that's expected; Ctrl+V still works)
    2. voice_id — visible; press Enter while blank to LIST your voices first, then paste the id

  Your key is used only on THIS PowerShell process: never echoed, never written to disk,
  never setx'd, and cleared when the run finishes.

  Optional power-use flags: -VoiceId <id>  -Force  -List  -Model <id>
#>
param(
  [string]$VoiceId,
  [switch]$Force,
  [switch]$List,
  [string]$Model
)
$ErrorActionPreference = 'Stop'
$gen = Join-Path $PSScriptRoot 'generate-narration.js'
if (-not (Test-Path $gen)) { Write-Host "Can't find generate-narration.js next to this script." -ForegroundColor Red; return }

function Set-KeyFromPrompt {
  if ($env:ELEVENLABS_API_KEY) { Write-Host "Using ELEVENLABS_API_KEY already in your environment." -ForegroundColor DarkGray; return }
  $sec = Read-Host -AsSecureString 'Paste your ElevenLabs API key (hidden — paste still works), then Enter'
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $env:ELEVENLABS_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  if ([string]::IsNullOrWhiteSpace($env:ELEVENLABS_API_KEY)) { Write-Host 'No key entered. Aborting.' -ForegroundColor Red; exit 1 }
}

try {
  Set-KeyFromPrompt

  if ($List) { & node $gen --list; return }

  if ([string]::IsNullOrWhiteSpace($VoiceId)) {
    $VoiceId = Read-Host 'Paste your voice_id (or press Enter to list your voices first)'
  }
  if ([string]::IsNullOrWhiteSpace($VoiceId)) {
    Write-Host "`nYour ElevenLabs voices:" -ForegroundColor Cyan
    & node $gen --list
    $VoiceId = Read-Host "`nNow paste the voice_id you want"
  }
  if ([string]::IsNullOrWhiteSpace($VoiceId)) { Write-Host 'No voice_id entered. Aborting.' -ForegroundColor Red; return }

  $argv = @($gen, '--voice', $VoiceId)
  if (-not [string]::IsNullOrWhiteSpace($Model)) { $argv += @('--model', $Model) }
  if ($Force) { $argv += '--force' }
  Write-Host "Generating narration clips with voice $VoiceId ..." -ForegroundColor Cyan
  & node @argv
}
finally {
  $env:ELEVENLABS_API_KEY = $null
}
