"""Optional asset regeneration: python3 -m pip install Pillow first."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'assets'
root.mkdir(exist_ok=True)
icon = Image.new('RGB', (1024, 1024), '#F6F5EF')
draw = ImageDraw.Draw(icon)
draw.ellipse((116, 116, 908, 908), fill='#E4EBCF')
draw.rounded_rectangle((268, 268, 756, 756), radius=162, fill='#295440')
for x, height in [(393, 278), (488, 198), (583, 118)]:
    draw.rounded_rectangle((x, 512-height//2, x+47, 512+height//2), radius=23, fill='#E8EFCE')
icon.save(root / 'icon.png')
icon.resize((256, 256)).save(root / 'favicon.png')
icon.save(root / 'splash-icon.png')
print('Generated app icon, favicon and splash artwork.')
