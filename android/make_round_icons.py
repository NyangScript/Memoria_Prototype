from PIL import Image, ImageDraw
import os

sizes = [
    (192, 'xxxhdpi'),
    (144, 'xxhdpi'),
    (96, 'xhdpi'),
    (72, 'hdpi'),
    (48, 'mdpi'),
]

img = Image.open('../icon.png').convert('RGBA')

os.makedirs('icon_resized', exist_ok=True)

for size, dpi in sizes:
    im = img.resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    out = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    out.paste(im, (0, 0), mask)
    out.save(f'icon_resized/ic_launcher_round_{dpi}.png') 