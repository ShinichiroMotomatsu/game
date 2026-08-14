param(
  [string]$Source = (Join-Path $PSScriptRoot '..\assets\v2\roppongi-roads-day-geographic-v3.png'),
  [string]$Edition = 'day'
)

$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing

$root=Resolve-Path (Join-Path $PSScriptRoot '..')
$sourcePath=[System.IO.Path]::GetFullPath($Source)
$sourceDir=Join-Path $root "assets\v2\$Edition-source-tiles"
$outDir=Join-Path $root "assets\v2\$Edition-runtime-tiles"
New-Item -ItemType Directory -Force -Path $sourceDir,$outDir|Out-Null

# Always derive the four overlapping source tiles from one continuous base PNG.
# This keeps road geometry identical on both sides of every runtime seam.
$base=[Drawing.Bitmap]::FromFile($sourcePath)
try {
  if($base.Width-ne1505-or$base.Height-ne1045){
    throw "Expected a 1505x1045 base PNG, got $($base.Width)x$($base.Height): $sourcePath"
  }
  $sourceSpecs=@(
    @('0-0',0,0,848,618),
    @('1-0',656,0,849,618),
    @('0-1',0,426,848,619),
    @('1-1',656,426,849,619)
  )
  foreach($sourceSpec in $sourceSpecs){
    $sourceRect=New-Object Drawing.Rectangle($sourceSpec[1],$sourceSpec[2],$sourceSpec[3],$sourceSpec[4])
    $sourceTile=$base.Clone($sourceRect,[Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $sourceTile.Save((Join-Path $sourceDir "$($sourceSpec[0]).png"),[Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $sourceTile.Dispose()
    }
  }
}
finally {
  $base.Dispose()
}

$masterW=3010;$masterH=2090;$tileW=1505;$tileH=1045
$master=New-Object Drawing.Bitmap($masterW,$masterH,[Drawing.Imaging.PixelFormat]::Format24bppRgb)
$masterGraphics=[Drawing.Graphics]::FromImage($master)

# Each source tile has 96px of overlap around the original split. Upscale the
# entire overlapping tile first, then crop its 2x core 192px away from the edge.
# All quadrants therefore use identical source pixels and interpolation context
# at the final seams; no generative reinterpretation or seam patch is involved.
$specs=@(
  @('0-0',0,0,1504,1044,0,0),
  @('1-0',1504,0,1506,1044,192,0),
  @('0-1',0,1044,1504,1046,0,192),
  @('1-1',1504,1044,1506,1046,192,192)
)

foreach($spec in $specs){
  $sourceImage=[Drawing.Image]::FromFile((Join-Path $sourceDir "$($spec[0]).png"))
  $upscaled=New-Object Drawing.Bitmap(($sourceImage.Width*2),($sourceImage.Height*2),[Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $upscaledGraphics=[Drawing.Graphics]::FromImage($upscaled)
  $upscaledGraphics.CompositingQuality=[Drawing.Drawing2D.CompositingQuality]::HighQuality
  $upscaledGraphics.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $upscaledGraphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $upscaledGraphics.DrawImage($sourceImage,(New-Object Drawing.Rectangle(0,0,$upscaled.Width,$upscaled.Height)))

  # Restore a small amount of pixel-art edge definition without changing geometry.
  $matrix=New-Object Drawing.Imaging.ColorMatrix
  $matrix.Matrix00=1;$matrix.Matrix11=1;$matrix.Matrix22=1;$matrix.Matrix33=0.14;$matrix.Matrix44=1
  $attributes=New-Object Drawing.Imaging.ImageAttributes
  $attributes.SetColorMatrix($matrix)
  $upscaledGraphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $upscaledGraphics.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
  $upscaledGraphics.DrawImage($sourceImage,(New-Object Drawing.Rectangle(0,0,$upscaled.Width,$upscaled.Height)),0,0,$sourceImage.Width,$sourceImage.Height,[Drawing.GraphicsUnit]::Pixel,$attributes)
  $attributes.Dispose();$upscaledGraphics.Dispose();$sourceImage.Dispose()

  $destination=New-Object Drawing.Rectangle($spec[1],$spec[2],$spec[3],$spec[4])
  $core=New-Object Drawing.Rectangle($spec[5],$spec[6],$spec[3],$spec[4])
  $masterGraphics.DrawImage($upscaled,$destination,$core,[Drawing.GraphicsUnit]::Pixel)
  $upscaled.Dispose()
}

# Runtime PNGs are exact, non-resampled quadrants of the reconciled 2x master.
for($row=0;$row-lt2;$row++){
  for($col=0;$col-lt2;$col++){
    $tile=New-Object Drawing.Bitmap($tileW,$tileH,[Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $tileGraphics=[Drawing.Graphics]::FromImage($tile)
    $sourceRect=New-Object Drawing.Rectangle(($col*$tileW),($row*$tileH),$tileW,$tileH)
    $tileGraphics.DrawImage($master,(New-Object Drawing.Rectangle(0,0,$tileW,$tileH)),$sourceRect,[Drawing.GraphicsUnit]::Pixel)
    $tile.Save((Join-Path $outDir "$col-$row.png"),[Drawing.Imaging.ImageFormat]::Png)
    $tileGraphics.Dispose();$tile.Dispose()
  }
}

$preview=New-Object Drawing.Bitmap(1505,1045,[Drawing.Imaging.PixelFormat]::Format24bppRgb)
$previewGraphics=[Drawing.Graphics]::FromImage($preview)
$previewGraphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$previewGraphics.DrawImage($master,0,0,1505,1045)
$preview.Save((Join-Path $root "tmp\v2-$Edition-enhanced-preview.png"),[Drawing.Imaging.ImageFormat]::Png)
$previewGraphics.Dispose();$preview.Dispose();$masterGraphics.Dispose();$master.Dispose()
