# Render a complete phrase as artwork. Never distribute the Windows font file.
Add-Type -AssemblyName System.Drawing
$family = [System.Drawing.FontFamily]::new('Segoe Script')
$shape = [System.Drawing.Drawing2D.GraphicsPath]::new()
$shape.FillMode = [System.Drawing.Drawing2D.FillMode]::Winding
$format = [System.Drawing.StringFormat]::GenericTypographic.Clone()
$shape.AddString('Zhang Yu', $family, 0, 420, [System.Drawing.PointF]::new(0,0), $format)
$bounds = $shape.GetBounds()
$pad = 24
$matrix = [System.Drawing.Drawing2D.Matrix]::new()
$matrix.Translate($pad - $bounds.X, $pad - $bounds.Y)
$shape.Transform($matrix)
$bitmap = [System.Drawing.Bitmap]::new([int][Math]::Ceiling($bounds.Width + 2*$pad), [int][Math]::Ceiling($bounds.Height + 2*$pad), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#bd5f39'))
$graphics.FillPath($brush, $shape)
$target = Join-Path $PSScriptRoot '../assets/signature-zhang-yu-v1.png'
$bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Signature: $($bitmap.Width)x$($bitmap.Height), alpha=$($bitmap.GetPixel(0,0).A)"
$brush.Dispose(); $graphics.Dispose(); $bitmap.Dispose(); $shape.Dispose(); $family.Dispose(); $matrix.Dispose(); $format.Dispose()
