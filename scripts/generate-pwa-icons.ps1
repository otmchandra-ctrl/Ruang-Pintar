Add-Type -AssemblyName System.Drawing

$srcPath = "C:\laragon\www\Ruang-Pintar\public\brand\ruang-pintar-mark.png"
$iconsDir = "C:\laragon\www\Ruang-Pintar\public\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

function Resize-Image {
    param (
        [System.Drawing.Bitmap]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [bool]$isMaskable = $false,
        [bool]$hasBackground = $false
    )

    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($hasBackground -or $isMaskable) {
        # Brand Dark Background #0F172A (RGB: 15, 23, 42)
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
        $graphics.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
        $brush.Dispose()
    } else {
        $graphics.Clear([System.Drawing.Color]::Transparent)
    }

    if ($isMaskable) {
        # 80% size centered to respect safe-zone
        $padX = [int]($targetWidth * 0.1)
        $padY = [int]($targetHeight * 0.1)
        $drawW = $targetWidth - (2 * $padX)
        $drawH = $targetHeight - (2 * $padY)
        $graphics.DrawImage($source, $padX, $padY, $drawW, $drawH)
    } else {
        $graphics.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    }

    $graphics.Dispose()
    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Created: $outputPath ($targetWidth x $targetHeight)"
}

# 1. Standard icons
Resize-Image -source $srcBmp -targetWidth 192 -targetHeight 192 -outputPath "$iconsDir\icon-192x192.png"
Resize-Image -source $srcBmp -targetWidth 512 -targetHeight 512 -outputPath "$iconsDir\icon-512x512.png"

# 2. Maskable icons (with safe-zone & brand background)
Resize-Image -source $srcBmp -targetWidth 192 -targetHeight 192 -outputPath "$iconsDir\icon-maskable-192x192.png" -isMaskable $true
Resize-Image -source $srcBmp -targetWidth 512 -targetHeight 512 -outputPath "$iconsDir\icon-maskable-512x512.png" -isMaskable $true

# 3. Apple Touch Icon (180x180, solid brand background as per iOS human guidelines)
Resize-Image -source $srcBmp -targetWidth 180 -targetHeight 180 -outputPath "$iconsDir\apple-touch-icon.png" -isMaskable $true

# 4. Favicon (48x48 and 32x32)
Resize-Image -source $srcBmp -targetWidth 48 -targetHeight 48 -outputPath "C:\laragon\www\Ruang-Pintar\public\favicon.png"
Resize-Image -source $srcBmp -targetWidth 32 -targetHeight 32 -outputPath "$iconsDir\favicon-32x32.png"
Resize-Image -source $srcBmp -targetWidth 16 -targetHeight 16 -outputPath "$iconsDir\favicon-16x16.png"

$srcBmp.Dispose()
Write-Host "All PWA icons generated successfully."
