#!/usr/bin/env python3
"""
DineDeck Official Brand Asset Generator
Generates all universal brand assets from the official DineDeck logo reference.
"""

import os
import shutil
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCE_IMAGE_PATH = os.path.join(ROOT_DIR, "brand-assets", "official-dinedeck-source-logo.png")
if not os.path.exists(SOURCE_IMAGE_PATH):
    SOURCE_IMAGE_PATH = os.path.join(ROOT_DIR, "brand-assets", "dinedeck-emblem-1024.png")
BRAND_ASSETS_DIR = os.path.join(ROOT_DIR, "brand-assets")

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def generate_assets():
    print("[BrandAssetGen] Loading official source logo...")
    if not os.path.exists(SOURCE_IMAGE_PATH):
        raise FileNotFoundError(f"Source logo not found at {SOURCE_IMAGE_PATH}")

    src_img = Image.open(SOURCE_IMAGE_PATH).convert("RGBA")
    arr = np.array(src_img)

    # Clean alpha noise (alpha <= 5 -> 0)
    noise_mask = arr[:, :, 3] <= 5
    arr[noise_mask, 3] = 0

    clean_img = Image.fromarray(arr)
    bbox_full = clean_img.getbbox()
    print(f"[BrandAssetGen] Cleaned full logo bbox: {bbox_full}")

    # 1. Full logo (original: Dine in Navy, Deck in Orange)
    full_logo_light = clean_img.crop(bbox_full)

    # 2. Dark-mode full logo (Dine in White, Deck in Orange)
    dark_arr = arr.copy()
    # Wordmark region: rows 451 to 612, cols 52 to 52 + 427
    dine_mask = (dark_arr[451:612, 52:52+427, 3] > 0)
    dark_arr[451:612, 52:52+427, 0][dine_mask] = 255
    dark_arr[451:612, 52:52+427, 1][dine_mask] = 255
    dark_arr[451:612, 52:52+427, 2][dine_mask] = 255
    full_logo_dark = Image.fromarray(dark_arr).crop(bbox_full)

    # 3. Emblem crop (the iconic 'D' with fork handle and cloche plate)
    emblem_raw = clean_img.crop((323, 87, 717, 451))
    emblem_bbox = emblem_raw.getbbox()
    emblem = emblem_raw.crop(emblem_bbox)
    print(f"[BrandAssetGen] Cleaned emblem size: {emblem.size}")

    # Helper: make square centered emblem
    def make_square_emblem(size, padding_pct=0.06):
        sq = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        target_size = int(size * (1 - 2 * padding_pct))
        scale = min(target_size / emblem.width, target_size / emblem.height)
        new_w = max(1, int(emblem.width * scale))
        new_h = max(1, int(emblem.height * scale))
        resized = emblem.resize((new_w, new_h), Image.Resampling.LANCZOS)
        x = (size - new_w) // 2
        y = (size - new_h) // 2
        sq.paste(resized, (x, y), resized)
        return sq

    # Helper: make circular / rounded-rect app icon
    def make_app_icon(size, is_round=False, bg_color=(11, 17, 32, 255), padding_pct=0.14):
        # Default bg_color: #0B1120 (DineDeck Dark Navy)
        icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(icon)
        if is_round:
            draw.ellipse((0, 0, size, size), fill=bg_color)
        else:
            radius = int(size * 0.22)
            draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=bg_color)

        # Place emblem centered
        target_size = int(size * (1 - 2 * padding_pct))
        scale = min(target_size / emblem.width, target_size / emblem.height)
        new_w = max(1, int(emblem.width * scale))
        new_h = max(1, int(emblem.height * scale))
        resized = emblem.resize((new_w, new_h), Image.Resampling.LANCZOS)
        x = (size - new_w) // 2
        y = (size - new_h) // 2
        icon.paste(resized, (x, y), resized)
        return icon

    # Save to central brand-assets directory
    ensure_dir(BRAND_ASSETS_DIR)
    full_logo_light.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-full.png"), optimize=True)
    full_logo_dark.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-dark.png"), optimize=True)

    # Various sizes of emblem
    for s in [1024, 512, 256, 192, 128, 96, 72, 64, 48, 32, 16]:
        sq_emblem = make_square_emblem(s)
        sq_emblem.save(os.path.join(BRAND_ASSETS_DIR, f"dinedeck-emblem-{s}.png"), optimize=True)

    # Master emblem (512)
    emblem_512 = make_square_emblem(512)
    emblem_512.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-emblem.png"), optimize=True)

    # Master App Icons (1024x1024)
    app_icon_primary = make_app_icon(1024, is_round=False)
    app_icon_round = make_app_icon(1024, is_round=True)
    app_icon_primary.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-app-icon-1024.png"), optimize=True)
    app_icon_round.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-app-icon-round-1024.png"), optimize=True)

    # Desktop ICO files (16, 24, 32, 48, 64, 128, 256)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_img = make_app_icon(256, is_round=False)
    ico_path = os.path.join(BRAND_ASSETS_DIR, "dinedeck.ico")
    ico_img.save(ico_path, format="ICO", sizes=ico_sizes)

    print("[BrandAssetGen] Central brand-assets created successfully!")

    # 4. Copy to Target Applications

    # A. Web Favicons & Assets
    web_targets = [
        os.path.join(ROOT_DIR, "admin-web", "public"),
        os.path.join(ROOT_DIR, "partner-web", "public"),
        os.path.join(ROOT_DIR, "customer-web", "public"),
    ]
    for wdir in web_targets:
        ensure_dir(wdir)
        # 32x32 favicon.png
        make_square_emblem(32, padding_pct=0.04).save(os.path.join(wdir, "favicon.png"))
        # multi-size favicon.ico
        make_square_emblem(64, padding_pct=0.04).save(
            os.path.join(wdir, "favicon.ico"),
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)]
        )
        # Emblem and Logos for web apps
        full_logo_light.save(os.path.join(wdir, "dinedeck-logo.png"), optimize=True)
        full_logo_dark.save(os.path.join(wdir, "dinedeck-logo-dark.png"), optimize=True)
        emblem_512.save(os.path.join(wdir, "dinedeck-emblem.png"), optimize=True)
        make_square_emblem(192).save(os.path.join(wdir, "logo192.png"), optimize=True)
        make_square_emblem(512).save(os.path.join(wdir, "logo512.png"), optimize=True)

    # B. Desktop Applications
    desktop_targets = [
        os.path.join(ROOT_DIR, "desktop-admin", "assets"),
        os.path.join(ROOT_DIR, "desktop-partner", "assets"),
    ]
    for ddir in desktop_targets:
        ensure_dir(ddir)
        ico_img.save(os.path.join(ddir, "icon.ico"), format="ICO", sizes=ico_sizes)
        app_icon_primary.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(ddir, "icon.png"), optimize=True)
        full_logo_dark.save(os.path.join(ddir, "dinedeck-logo-dark.png"), optimize=True)
        emblem_512.save(os.path.join(ddir, "dinedeck-emblem.png"), optimize=True)

    # C. Android Apps (admin-app, partner-app, app)
    android_modules = [
        os.path.join(ROOT_DIR, "admin-app", "src", "main", "res"),
        os.path.join(ROOT_DIR, "partner-app", "src", "main", "res"),
        os.path.join(ROOT_DIR, "app", "src", "main", "res"),
    ]

    # Android mipmap densities: mdpi (48), hdpi (72), xhdpi (96), xxhdpi (144), xxxhdpi (192)
    density_map = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    for amod in android_modules:
        for folder, d_size in density_map.items():
            f_dir = os.path.join(amod, folder)
            ensure_dir(f_dir)
            # Regular square icon
            make_app_icon(d_size, is_round=False).save(os.path.join(f_dir, "ic_launcher.png"), optimize=True)
            # Round icon
            make_app_icon(d_size, is_round=True).save(os.path.join(f_dir, "ic_launcher_round.png"), optimize=True)

        # Also place high-res logo in drawable for in-app splash/branding
        draw_dir = os.path.join(amod, "drawable")
        ensure_dir(draw_dir)
        emblem_512.save(os.path.join(draw_dir, "dinedeck_emblem.png"), optimize=True)
        full_logo_dark.save(os.path.join(draw_dir, "dinedeck_logo_dark.png"), optimize=True)

    # D. docs/assets/brand/
    docs_favicons = os.path.join(ROOT_DIR, "docs", "assets", "brand", "favicons")
    ensure_dir(docs_favicons)
    for s in [16, 32, 48, 64]:
        make_square_emblem(s).save(os.path.join(docs_favicons, f"favicon_{s}x{s}.png"))
        make_square_emblem(s).save(os.path.join(docs_favicons, f"favicon_admin_{s}x{s}.png"))
        make_square_emblem(s).save(os.path.join(docs_favicons, f"favicon_partner_{s}x{s}.png"))

    docs_pwa = os.path.join(ROOT_DIR, "docs", "assets", "brand", "pwa")
    ensure_dir(docs_pwa)
    for s in [72, 96, 128, 144, 152, 192, 384, 512]:
        make_app_icon(s, is_round=False).save(os.path.join(docs_pwa, f"icon_{s}x{s}.png"))
        make_app_icon(s, is_round=False).save(os.path.join(docs_pwa, f"admin_{s}x{s}.png"))
        make_app_icon(s, is_round=False).save(os.path.join(docs_pwa, f"partner_{s}x{s}.png"))

    docs_desktop = os.path.join(ROOT_DIR, "docs", "assets", "brand", "desktop")
    ensure_dir(docs_desktop)
    ico_img.save(os.path.join(docs_desktop, "dinedeck_admin.ico"), format="ICO", sizes=ico_sizes)
    ico_img.save(os.path.join(docs_desktop, "dinedeck_partner.ico"), format="ICO", sizes=ico_sizes)
    ico_img.save(os.path.join(docs_desktop, "dinedeck_app.ico"), format="ICO", sizes=ico_sizes)

    # E. Scalable Vector SVGs
    import base64
    with open(os.path.join(BRAND_ASSETS_DIR, "dinedeck-emblem.png"), "rb") as f:
        b64_emblem = base64.b64encode(f.read()).decode("utf-8")
    svg_emblem = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,{b64_emblem}"/>
</svg>'''

    with open(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-dark.png"), "rb") as f:
        b64_logo_dark = base64.b64encode(f.read()).decode("utf-8")
    svg_logo_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 525" width="100%" height="100%">
  <image width="920" height="525" href="data:image/png;base64,{b64_logo_dark}"/>
</svg>'''

    with open(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-full.png"), "rb") as f:
        b64_logo_light = base64.b64encode(f.read()).decode("utf-8")
    svg_logo_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 525" width="100%" height="100%">
  <image width="920" height="525" href="data:image/png;base64,{b64_logo_light}"/>
</svg>'''

    for svg_file, svg_data in [
        ("dinedeck-emblem.svg", svg_emblem),
        ("dinedeck-logo-dark.svg", svg_logo_dark),
        ("dinedeck-logo.svg", svg_logo_light),
    ]:
        with open(os.path.join(BRAND_ASSETS_DIR, svg_file), "w", encoding="utf-8") as f:
            f.write(svg_data)
        for wdir in web_targets:
            with open(os.path.join(wdir, svg_file), "w", encoding="utf-8") as f:
                f.write(svg_data)

    print("[BrandAssetGen] All universal platform assets generated and deployed successfully!")

if __name__ == "__main__":
    generate_assets()
