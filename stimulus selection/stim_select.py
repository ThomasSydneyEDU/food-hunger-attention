import pandas as pd
import os

# Path to the CSV and image folder
csv_path = "/Users/tcar5787/Documents/GitHub/food-hunger-attention/stimulus selection/food_list.csv"
img_folder = "/Users/tcar5787/Documents/GitHub/food-hunger-attention/stimulus selection/img"
non_food_folder = "/Users/tcar5787/Documents/GitHub/food-hunger-attention/stimulus selection/non_food_img"

# --- Convert all food JPG images to PNGs with transparency ---
from PIL import Image
import numpy as np

# Output folder for PNG images with transparency
output_png_folder = os.path.join(img_folder, "converted_png")
os.makedirs(output_png_folder, exist_ok=True)

for file in os.listdir(img_folder):
    if file.lower().endswith('.jpg'):
        jpg_path = os.path.join(img_folder, file)
        img = Image.open(jpg_path).convert("RGB")
        img_array = np.array(img)

        # Sample 5x5 patch in the top-left corner
        patch = img_array[:5, :5].reshape(-1, 3)
        white_rgb = patch.mean(axis=0).round().astype(np.uint8)

        # Create alpha channel
        matches_white = np.all(img_array == white_rgb, axis=-1)
        alpha_channel = np.where(matches_white, 0, 255).astype(np.uint8)

        # Combine RGB with alpha
        rgba_array = np.dstack((img_array, alpha_channel))
        img_rgba = Image.fromarray(rgba_array, mode="RGBA")

        png_name = os.path.splitext(file)[0] + ".png"
        png_path = os.path.join(output_png_folder, png_name)
        img_rgba.save(png_path)

print(f"✅ Converted JPEGs to transparent PNGs in: {output_png_folder}")

# --- Convert non-food JPG images to PNGs with transparency ---
non_food_png_folder = os.path.join(non_food_folder, "converted_png")
os.makedirs(non_food_png_folder, exist_ok=True)

for file in os.listdir(non_food_folder):
    if file.lower().endswith('.jpg'):
        jpg_path = os.path.join(non_food_folder, file)
        img = Image.open(jpg_path).convert("RGB")
        img_array = np.array(img)

        # Sample 5x5 patch in the top-left corner
        patch = img_array[:5, :5].reshape(-1, 3)
        white_rgb = patch.mean(axis=0).round().astype(np.uint8)

        # Create alpha channel
        matches_white = np.all(img_array == white_rgb, axis=-1)
        alpha_channel = np.where(matches_white, 0, 255).astype(np.uint8)

        # Combine RGB with alpha
        rgba_array = np.dstack((img_array, alpha_channel))
        img_rgba = Image.fromarray(rgba_array, mode="RGBA")

        png_name = os.path.splitext(file)[0] + ".png"
        png_path = os.path.join(non_food_png_folder, png_name)
        img_rgba.save(png_path)

print(f"✅ Converted non-food JPEGs to transparent PNGs in: {non_food_png_folder}")

# Load the CSV
df = pd.read_csv(csv_path)

# Create a column for expected image file names
df['Expected Image Filename'] = df['Aussie Name'].str.replace(' ', '_') + '.jpg'

# Check which image files exist
df['Image Exists'] = df['Expected Image Filename'].apply(lambda x: os.path.isfile(os.path.join(img_folder, x)))

# Optional: View missing entries
missing_images = df[~df['Image Exists']]
print(f"Missing {len(missing_images)} images:")
print(missing_images[['Aussie Name', 'Expected Image Filename']])

# Ensure the calorie column is numeric
df['Mean Perceived Calorie'] = pd.to_numeric(df['Mean Perceived Calorie'], errors='coerce')

# Drop rows with missing calorie data and missing images
df_valid = df.dropna(subset=['Mean Perceived Calorie'])
df_valid = df_valid[df_valid['Image Exists']]

# Sort by calorie value
df_sorted = df_valid.sort_values(by='Mean Perceived Calorie', ascending=False).reset_index(drop=True)

# Select top, middle, and bottom 16
top_16 = df_sorted.head(16)
middle_start = len(df_sorted) // 2 - 8
middle_16 = df_sorted.iloc[middle_start:middle_start + 16]
bottom_16 = df_sorted.tail(16)

# Combine into a new DataFrame

selected_df = pd.concat([top_16, middle_16, bottom_16]).reset_index(drop=True)
selected_df = selected_df[['Aussie Name', 'Mean Perceived Calorie']]


# Gather non-food .png files (converted from .jpg previously)
non_food_images = [f for f in os.listdir(non_food_png_folder) if f.lower().endswith('.png')]

# Create a new DataFrame for non-food images, setting calorie to 0
non_food_df = pd.DataFrame({
    'Aussie Name': [os.path.splitext(f)[0].replace('_', ' ') for f in non_food_images],
    'Mean Perceived Calorie': [0] * len(non_food_images)
})

# Append to selected_df
selected_df = pd.concat([selected_df, non_food_df], ignore_index=True)

# Optional: print new total
print(f"Total stimuli including non-food items: {len(selected_df)}")

# Optional: print summary
print("Selected high, middle, and low calorie items (plus non-food):")
print(selected_df[['Aussie Name', 'Mean Perceived Calorie']])

import shutil

# Create the 'stimuli' folder if it doesn't exist
stimuli_folder = "/Users/tcar5787/Documents/GitHub/food-hunger-attention/stimulus selection/stimuli"
os.makedirs(stimuli_folder, exist_ok=True)

# Define source folders
source_folders = [output_png_folder, non_food_png_folder]

# Rename columns and replace spaces with underscores in 'Name'
selected_df['Name'] = selected_df['Aussie Name'].str.replace(' ', '_')
selected_df = selected_df.drop(columns=['Aussie Name'])
selected_df = selected_df.rename(columns={'Mean Perceived Calorie': 'Calorie'})

# Generate list of expected image filenames
filenames = selected_df['Name'] + '.png'

# Copy images to the stimuli folder
for filename in filenames:
    for source in source_folders:
        src_path = os.path.join(source, filename)
        if os.path.exists(src_path):
            dst_path = os.path.join(stimuli_folder, filename)
            shutil.copyfile(src_path, dst_path)
            break  # Stop searching once found
print(f"✅ Copied {len(filenames)} image files to: {stimuli_folder}")

# Export the final selected_df to a CSV suitable for JSPsych
output_csv = os.path.join(stimuli_folder, 'stimulus_list.csv')
selected_df.to_csv(output_csv, index=False)
print(f"✅ Exported stimulus list to: {output_csv}")

# Export as JavaScript file
js_list_path = os.path.join(stimuli_folder, 'stimulus_list.js')
with open(js_list_path, 'w') as js_file:
    js_file.write("const stimulus_list = [\n")
    for _, row in selected_df.iterrows():
        name = row['Name']
        calorie = 'null' if pd.isna(row['Calorie']) else row['Calorie']
        js_file.write(f'  {{ Name: "{name}", Calorie: {calorie} }},\n')
    js_file.write("];\n")

print(f"✅ Exported stimulus list to: {js_list_path}")
