<#
  Hidden-key launcher for the ElevenLabs narration generator.
  Your API key is read from a hidden prompt and lives ONLY in this process's environment —
  it is never echoed, never written to disk, and never passed on the command line.

  Examples:
    ./tools/generate-narration.ps1 -List                       # list your account voices (pick a voice_id)
    ./tools/generate-narration.ps1 -VoiceId "abc123..."         # generate all missing clips
    ./tools/generate-narration.ps1 -VoiceId "abc123..." -Force  # re-render everything
    ./tools/generate-narration.ps1 -Dry                         # plan + cost estimate, no API calls (no key needed)
#>
param(
  [string]$VoiceId,
  [switch]$List,
  [switch]$Force,
  [switch]$Dry,
  [string]$Model
)
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'generate-narration.js'

if (-not $Dry -and -not $env:ELEVENLABS_API_KEY) {
  $sec = Read-Host -AsSecureString 'Enter your ElevenLabs API key (input hidden)'
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $env:ELEVENLABS_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

$argv = @($script)
if ($List)  { $argv += '--list' }
if ($Force) { $argv += '--force' }
if ($Dry)   { $argv += '--dry' }
if ($VoiceId) { $argv += @('--voice', $VoiceId) }
if ($Model)   { $argv += @('--model', $Model) }

& node @argv
