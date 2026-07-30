import os
import random

FRONTEND_IMG_DIR = "../frontend/public/img"
SERVER_FILE = "server.py"

def get_files(subpath):
    path = os.path.join(FRONTEND_IMG_DIR, subpath)
    if not os.path.exists(path): return []
    return [f"/img/{subpath}/{f}" for f in os.listdir(path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

def generate_products():
    wigs = get_files("products/wigs")
    cosmetics = get_files("products/haircair_solution_and_creams")
    
    # We will generate about 50 products. 
    # Say 30 wigs, 20 cosmetics (if we have enough images, otherwise cycle)
    products_code = "PRODUCTS_SEED = [\n"
    
    # Add Wigs (Price 150-350)
    for i, img in enumerate(wigs[:30]):
        price = random.randint(150, 350)
        stock = random.randint(5, 20)
        badge = '"Bestseller"' if i % 5 == 0 else '""'
        products_code += f'    prod("wig-{i}", "Wigs", "Premium Wig {i+1}", "High-quality custom wig {i+1}. 100% human hair blend.", {price}, {stock}, "{img}", {badge}),\n'
    
    # Add Cosmetics (Price 12.99)
    for i, img in enumerate(cosmetics[:20]):
        stock = random.randint(20, 100)
        badge = '"New"' if i % 4 == 0 else '""'
        products_code += f'    prod("cosmetic-{i}", "Hair Care", "Cosmetic Product {i+1}", "Nourishing hair care product {i+1}.", 12.99, {stock}, "{img}", {badge}),\n'
        
    # Also add some default ones just to be safe if the dir is empty
    if not wigs and not cosmetics:
        products_code += '    prod("dummy", "Wigs", "Dummy", "Dummy", 150, 10, "dummy.jpg", ""),\n'

    products_code += "]\n"
    return products_code

def generate_gallery():
    gallery_files = get_files("Hair style")
    
    gallery_code = "GALLERY_SEED = [\n"
    for i, img in enumerate(gallery_files[:50]):
        category = random.choice(["Braids", "Knotless", "Boho", "Cornrows", "Locs", "Natural Hair", "Kids", "Wigs", "Products", "Salon"])
        gallery_code += f'    ("{category}", "{img}"),\n'
    
    if not gallery_files:
        gallery_code += '    ("Dummy", "dummy.jpg"),\n'

    gallery_code += "]\n"
    return gallery_code

def update_server_py():
    with open(SERVER_FILE, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Find PRODUCTS_SEED = [ ... ]
    prod_start = content.find("PRODUCTS_SEED = [")
    prod_end = content.find("]\n", prod_start) + 2
    
    # Find GALLERY_SEED = [ ... ]
    gal_start = content.find("GALLERY_SEED = [")
    gal_end = content.find("]\n", gal_start) + 2
    
    if prod_start == -1 or gal_start == -1:
        print("Could not find seed arrays")
        return
        
    new_prods = generate_products()
    new_gal = generate_gallery()
    
    # Because replacing offsets changes, do from end to start or use replace
    # We will just split and join.
    # Actually, string.replace won't work well if there are duplicates, but these are unique.
    
    new_content = content[:prod_start] + new_prods + content[prod_end:gal_start] + new_gal + content[gal_end:]
    
    with open(SERVER_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("Seed data updated successfully.")

if __name__ == "__main__":
    update_server_py()
