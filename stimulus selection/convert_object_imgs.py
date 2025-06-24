from PIL import Image
import os

# Path to your non-food image folder
non_food_folder = "/Users/tcar5787/Documents/GitHub/food-hunger-attention/stimulus selection/non_food_img"

# Loop through each PNG file
for file_name in os.listdir(non_food_folder):
    if file_name.lower().endswith('.png'):
        png_path = os.path.join(non_food_folder, file_name)
        jpg_name = os.path.splitext(file_name)[0] + '.jpg'
        jpg_path = os.path.join(non_food_folder, jpg_name)

        with Image.open(png_path) as im:
            # Handle transparency
            if im.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', im.size, (255, 255, 255))
                background.paste(im, mask=im.split()[-1])  # Use alpha channel
                background.save(jpg_path, 'JPEG')
            else:
                im.convert('RGB').save(jpg_path, 'JPEG')

print("✅ Conversion complete.")