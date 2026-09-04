$ErrorActionPreference = 'Stop'

Write-Host '=== Xisobot Android doimiy signing key yaratish ===' -ForegroundColor Cyan

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  Write-Host 'XATO: keytool topilmadi. JDK 17 yoki Android Studio JDK o\'rnatilgan bo\'lishi kerak.' -ForegroundColor Red
  exit 1
}

$alias = Read-Host 'Key alias (masalan: xisobot-release)'
if ([string]::IsNullOrWhiteSpace($alias)) { $alias = 'xisobot-release' }

$storePassSecure = Read-Host 'Keystore paroli' -AsSecureString
$keyPassSecure = Read-Host 'Key paroli (keystore paroli bilan bir xil bo\'lishi mumkin)' -AsSecureString

function SecureToPlain([Security.SecureString]$s) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$storePass = SecureToPlain $storePassSecure
$keyPass = SecureToPlain $keyPassSecure

if ($storePass.Length -lt 6 -or $keyPass.Length -lt 6) {
  Write-Host 'XATO: parol kamida 6 belgidan iborat bo\'lishi kerak.' -ForegroundColor Red
  exit 1
}

$outDir = Join-Path $PSScriptRoot 'signing-private'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$ks = Join-Path $outDir 'sysone-hisobot-release.keystore'
$b64 = Join-Path $outDir 'ANDROID_KEYSTORE_BASE64.txt'
$info = Join-Path $outDir 'GITHUB_SECRETS_NAMES.txt'

if (Test-Path $ks) {
  Write-Host 'XATO: keystore allaqachon mavjud. Xavfsizlik uchun ustidan yozilmadi:' -ForegroundColor Red
  Write-Host $ks
  exit 1
}

& keytool -genkeypair -v `
  -keystore $ks `
  -alias $alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 36500 `
  -storepass $storePass `
  -keypass $keyPass `
  -dname 'CN=Xisobot Nazorat, OU=SysOne, O=SysOne, L=Fargona, C=UZ'

if ($LASTEXITCODE -ne 0) { throw 'keytool xato bilan tugadi' }

$bytes = [IO.File]::ReadAllBytes($ks)
[Convert]::ToBase64String($bytes) | Set-Content -NoNewline -Encoding ascii $b64

@"
GitHub repository secrets:
ANDROID_KEYSTORE_BASE64  -> ANDROID_KEYSTORE_BASE64.txt ichidagi qiymat
ANDROID_KEYSTORE_PASSWORD -> siz kiritgan keystore paroli
ANDROID_KEY_ALIAS -> $alias
ANDROID_KEY_PASSWORD -> siz kiritgan key paroli

MUHIM: signing-private papkasini GitHub'ga commit QILMANG.
Keystore'ni xavfsiz joyda kamida 2 nusxada saqlang.
"@ | Set-Content -Encoding UTF8 $info

Write-Host ''
Write-Host 'TAYYOR.' -ForegroundColor Green
Write-Host "Keystore: $ks"
Write-Host "Base64:   $b64"
Write-Host "Yo'riqnoma: $info"
Write-Host ''
Write-Host 'Secret qiymatlarini chatga yubormang.' -ForegroundColor Yellow
