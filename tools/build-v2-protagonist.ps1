param(
  [string]$Source = (Join-Path $PSScriptRoot '..\assets\v2\protagonist-sheet-transparent.png'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\v2\protagonist')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($outputPath) | Out-Null

$sheet = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
  $cellWidth = [int]($sheet.Width / 2)
  $cellHeight = [int]($sheet.Height / 2)
  $cells = @(
    @{ Name = 'down';  X = 0;          Y = 0 },
    @{ Name = 'left';  X = $cellWidth; Y = 0 },
    @{ Name = 'right'; X = 0;          Y = $cellHeight },
    @{ Name = 'up';    X = $cellWidth; Y = $cellHeight }
  )

  foreach ($cell in $cells) {
    $minX = $cellWidth
    $minY = $cellHeight
    $maxX = -1
    $maxY = -1

    for ($y = 0; $y -lt $cellHeight; $y++) {
      for ($x = 0; $x -lt $cellWidth; $x++) {
        $pixel = $sheet.GetPixel($cell.X + $x, $cell.Y + $y)
        if ($pixel.A -gt 16) {
          if ($x -lt $minX) { $minX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }

    if ($maxX -lt 0) { throw "No visible pixels found for $($cell.Name)." }

    $padding = 10
    $minX = [Math]::Max(0, $minX - $padding)
    $minY = [Math]::Max(0, $minY - $padding)
    $maxX = [Math]::Min($cellWidth - 1, $maxX + $padding)
    $maxY = [Math]::Min($cellHeight - 1, $maxY + $padding)
    $crop = New-Object System.Drawing.Rectangle(
      ($cell.X + $minX),
      ($cell.Y + $minY),
      ($maxX - $minX + 1),
      ($maxY - $minY + 1)
    )

    $sprite = New-Object System.Drawing.Bitmap($crop.Width, $crop.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($sprite)
      try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.DrawImage($sheet, (New-Object System.Drawing.Rectangle(0, 0, $crop.Width, $crop.Height)), $crop, [System.Drawing.GraphicsUnit]::Pixel)
      }
      finally {
        $graphics.Dispose()
      }
      $destination = Join-Path $outputPath "$($cell.Name).png"
      $sprite.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Host "$($cell.Name): $($sprite.Width)x$($sprite.Height) -> $destination"
    }
    finally {
      $sprite.Dispose()
    }
  }
}
finally {
  $sheet.Dispose()
}
