import os

file_path = r'c:\Users\ty\Downloads\Dawayir-main\Dawayir-main\src\components\Landing.tsx'

# Read as bytes to avoid encoding issues
with open(file_path, 'rb') as f:
    data = f.read()

# Replace corrupted 'visibconst' with correct structure
# Note: fadeIn was:
# const fadeIn = {
#  hidden: { opacity: 0 },
#  visible: { opacity: 1, transition: { duration: 0.5, ease } }
# };

# Looking at the dump: 'visibconst' is the culprit.
# It should be 'visible: { opacity: 1, transition: { duration: 0.5, ease } }\n};\n\nconst'

old_corrupted = b'visibconst'
new_fixed = b'visible: { opacity: 1, transition: { duration: 0.5, ease } }\n};\n\nconst'

if old_corrupted in data:
    data = data.replace(old_corrupted, new_fixed)
    print("Found corruption, fixing...")
else:
    print("Could not find 'visibconst' in bytes.")

# Save as UTF-8
with open(file_path, 'wb') as f:
    f.write(data)

print("Repair complete.")
