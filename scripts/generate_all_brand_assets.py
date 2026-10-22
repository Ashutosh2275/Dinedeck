#!/usr/bin/env python3
"""
DineDeck Universal Brand Asset & Platform Identity Generator
Generates and distributes all official DineDeck brand assets across:
  - Customer: Web & PWA, Android
  - Partner: Web & PWA, Windows Desktop, Android
  - Super Admin: Web & PWA, Windows Desktop, Android

Website Favicons:
  Pure original brand logo directly on 100% transparent background.
  Zero colored boxes, backgrounds, borders, padding, or containers.
  Matches the clean favicon style of GitHub, YouTube, and ChatGPT.
"""

import os
import io
import shutil
import base64
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCE_IMAGE_PATH = os.path.join(ROOT_DIR, "brand-assets", "official-dinedeck-source-logo.png")
if not os.path.exists(SOURCE_IMAGE_PATH):
    SOURCE_IMAGE_PATH = os.path.join(ROOT_DIR, "brand-assets", "dinedeck-emblem-1024.png")

BRAND_ASSETS_DIR = os.path.join(ROOT_DIR, "brand-assets")
FONT_PATH = r"C:\Windows\Fonts\segoeuib.ttf"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def load_font(size):
    font_candidates = [
        FONT_PATH,
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for candidate in font_candidates:
        if candidate and os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size)
            except Exception:
                pass
    try:
        return ImageFont.load_default()
    except Exception:
        return None

def clean_alpha_noise(img):
    arr = np.array(img)
    noise_mask = arr[:, :, 3] <= 5
    arr[noise_mask, 3] = 0
    return Image.fromarray(arr)

def create_emblem_asset(src_img):
    # Extract official emblem (the stylized D cloche / fork / plate)
    # The emblem is located at x: 323 to 717, y: 87 to 451
    emblem_crop = src_img.crop((323, 87, 717, 451))
    bbox = emblem_crop.getbbox()
    return emblem_crop.crop(bbox)

def create_wordmark_logos(src_img):
    bbox_full = src_img.getbbox()
    full_logo_light = src_img.crop(bbox_full)

    # Dark mode logo: convert navy letters in "Dine" to white
    arr = np.array(src_img)
    dark_arr = arr.copy()
    dine_mask = (dark_arr[451:612, 52:52+427, 3] > 10) & (dark_arr[451:612, 52:52+427, 0] < 100)
    dark_arr[451:612, 52:52+427, 0][dine_mask] = 255
    dark_arr[451:612, 52:52+427, 1][dine_mask] = 255
    dark_arr[451:612, 52:52+427, 2][dine_mask] = 255
    full_logo_dark = Image.fromarray(dark_arr).crop(bbox_full)

    return full_logo_light, full_logo_dark

def make_centered_emblem(emblem, size, padding_pct=0.06):
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

def make_pure_transparent_favicon(emblem, size):
    """
    Pure original brand logo directly on 100% transparent background.
    Zero colored boxes, backgrounds, borders, padding, or containers.
    Matches the clean favicon style of GitHub, YouTube, and ChatGPT.
    """
    fav = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min(size / emblem.width, size / emblem.height)
    new_w = max(1, int(round(emblem.width * scale)))
    new_h = max(1, int(round(emblem.height * scale)))
    resized = emblem.resize((new_w, new_h), Image.Resampling.LANCZOS)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    fav.paste(resized, (x, y), resized)
    return fav

def generate_transparent_favicon_ico(emblem, out_path):
    """
    Multi-resolution favicon.ico (16, 32, 48) with 100% transparent background.
    """
    sizes = [(16, 16), (32, 32), (48, 48)]
    images = [make_pure_transparent_favicon(emblem, s) for s, _ in sizes]
    buf = io.BytesIO()
    images[-1].save(buf, format="ICO", sizes=sizes, append_images=images[:-1])
    with open(out_path, "wb") as f:
        f.write(buf.getvalue())

def generate_transparent_favicon_svg(emblem):
    """
    Vector-compatible SVG favicon with 100% transparent background.
    Uses a square 512x512 canvas with the pure emblem centered for optimal
    browser tab display (matches GitHub, YouTube, ChatGPT).
    """
    fav_512 = make_pure_transparent_favicon(emblem, 512)
    buf = io.BytesIO()
    fav_512.save(buf, format="PNG", optimize=True)
    b64_fav = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,{b64_fav}"/>
</svg>'''

def make_suite_icon(emblem, size, suite_type='customer', is_round=False):
    """
    Application launcher icons for Android and Desktop executables.
    """
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)

    if suite_type == 'customer':
        bg_color = (11, 15, 25, 255)       # Obsidian Navy #0B0F19
        ring_color = (255, 107, 0, 220)    # Orange #FF6B00
        border_w = max(2, int(size * 0.024))
        emblem_scale_pct = 0.62
        offset_y = 0

    elif suite_type == 'partner':
        bg_color = (15, 23, 42, 255)       # Slate Navy #0F172A
        ring_color = (255, 85, 0, 255)     # Partner Orange #FF5500
        border_w = max(3, int(size * 0.034))
        emblem_scale_pct = 0.54
        offset_y = -int(size * 0.05) if size >= 64 else 0

    elif suite_type == 'admin':
        bg_color = (9, 13, 22, 255)        # Midnight Navy #090D16
        ring_color = (6, 182, 212, 255)    # Cyan #06B6D4
        border_w = max(3, int(size * 0.034))
        emblem_scale_pct = 0.54
        offset_y = -int(size * 0.05) if size >= 64 else 0

    radius = int(size * 0.22)

    if is_round:
        draw.ellipse((0, 0, size - 1, size - 1), fill=bg_color, outline=ring_color, width=border_w)
    else:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=bg_color, outline=ring_color, width=border_w)

    target_emblem_size = int(size * emblem_scale_pct)
    scale = min(target_emblem_size / emblem.width, target_emblem_size / emblem.height)
    new_w = max(1, int(emblem.width * scale))
    new_h = max(1, int(emblem.height * scale))
    resized_emblem = emblem.resize((new_w, new_h), Image.Resampling.LANCZOS)
    ex = (size - new_w) // 2
    ey = (size - new_h) // 2 + offset_y
    icon.paste(resized_emblem, (ex, ey), resized_emblem)

    if size >= 64 and suite_type in ('partner', 'admin'):
        badge_w = int(size * 0.52)
        badge_h = max(12, int(size * 0.14))
        badge_x = (size - badge_w) // 2
        badge_y = size - badge_h - max(4, int(size * 0.07))
        badge_radius = badge_h // 2

        if suite_type == 'partner':
            b_bg = (255, 85, 0, 255)
            b_text = "PARTNER"
            t_col = (255, 255, 255, 255)
        else:
            b_bg = (6, 182, 212, 255)
            b_text = "ADMIN"
            t_col = (9, 13, 22, 255)

        draw.rounded_rectangle((badge_x, badge_y, badge_x + badge_w, badge_y + badge_h), radius=badge_radius, fill=b_bg)
        font_sz = max(8, int(badge_h * 0.62))
        font = load_font(font_sz)
        t_box = draw.textbbox((0, 0), b_text, font=font)
        tw = t_box[2] - t_box[0]
        th = t_box[3] - t_box[1]
        tx = badge_x + (badge_w - tw) // 2
        ty = badge_y + (badge_h - th) // 2 - t_box[1]
        draw.text((tx, ty), b_text, fill=t_col, font=font)

    return icon

def generate_desktop_ico(emblem, suite_type, out_path):
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    images = []
    for s, _ in sizes:
        img = make_suite_icon(emblem, s, suite_type=suite_type, is_round=False)
        images.append(img)
    buf = io.BytesIO()
    images[-1].save(buf, format="ICO", sizes=sizes, append_images=images[:-1])
    with open(out_path, "wb") as f:
        f.write(buf.getvalue())

def generate_svgs(brand_assets_dir):
    with open(os.path.join(brand_assets_dir, "dinedeck-emblem.png"), "rb") as f:
        b64_emblem = base64.b64encode(f.read()).decode("utf-8")
    svg_emblem = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,{b64_emblem}"/>
</svg>'''

    with open(os.path.join(brand_assets_dir, "dinedeck-logo-dark.png"), "rb") as f:
        b64_logo_dark = base64.b64encode(f.read()).decode("utf-8")
    svg_logo_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 958 653" width="100%" height="100%">
  <image width="958" height="653" href="data:image/png;base64,{b64_logo_dark}"/>
</svg>'''

    with open(os.path.join(brand_assets_dir, "dinedeck-logo-full.png"), "rb") as f:
        b64_logo_light = base64.b64encode(f.read()).decode("utf-8")
    svg_logo_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 958 653" width="100%" height="100%">
  <image width="958" height="653" href="data:image/png;base64,{b64_logo_light}"/>
</svg>'''

    return svg_emblem, svg_logo_dark, svg_logo_light

def main():
    print("=" * 60)
    print("  DINEDECK UNIVERSAL BRAND ASSET ENGINE")
    print("  Website Favicons: Pure Logo with Transparent Background")
    print("=" * 60)
    print(f"Loading source logo from: {SOURCE_IMAGE_PATH}")

    if not os.path.exists(SOURCE_IMAGE_PATH):
        raise FileNotFoundError(f"Missing master logo source at {SOURCE_IMAGE_PATH}")

    src_img = Image.open(SOURCE_IMAGE_PATH).convert("RGBA")
    src_img = clean_alpha_noise(src_img)

    emblem = create_emblem_asset(src_img)
    print(f"Extracted crisp official emblem: {emblem.size}")

    full_logo_light, full_logo_dark = create_wordmark_logos(src_img)
    print(f"Created light logo ({full_logo_light.size}) and dark logo ({full_logo_dark.size})")

    ensure_dir(BRAND_ASSETS_DIR)

    # 1. Save Core Brand Assets
    full_logo_light.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-full.png"), optimize=True)
    full_logo_dark.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-dark.png"), optimize=True)
    emblem_512 = make_centered_emblem(emblem, 512)
    emblem_512.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-emblem.png"), optimize=True)
    emblem_512.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-emblem-512.png"), optimize=True)

    for s in [1024, 256, 192, 128, 96, 72, 64, 48, 32, 16]:
        sq = make_centered_emblem(emblem, s)
        sq.save(os.path.join(BRAND_ASSETS_DIR, f"dinedeck-emblem-{s}.png"), optimize=True)

    # Pure transparent website favicon assets
    generate_transparent_favicon_ico(emblem, os.path.join(BRAND_ASSETS_DIR, "favicon.ico"))
    make_pure_transparent_favicon(emblem, 32).save(os.path.join(BRAND_ASSETS_DIR, "favicon.png"), optimize=True)
    svg_favicon = generate_transparent_favicon_svg(emblem)
    with open(os.path.join(BRAND_ASSETS_DIR, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_favicon)

    # Core SVGs
    svg_emblem, svg_logo_dark, svg_logo_light = generate_svgs(BRAND_ASSETS_DIR)
    with open(os.path.join(BRAND_ASSETS_DIR, "dinedeck-emblem.svg"), "w", encoding="utf-8") as f:
        f.write(svg_emblem)
    with open(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo-dark.svg"), "w", encoding="utf-8") as f:
        f.write(svg_logo_dark)
    with open(os.path.join(BRAND_ASSETS_DIR, "dinedeck-logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_logo_light)

    # Master App Icons (1024x1024)
    app_icon_cust = make_suite_icon(emblem, 1024, suite_type='customer', is_round=False)
    app_icon_part = make_suite_icon(emblem, 1024, suite_type='partner', is_round=False)
    app_icon_admin = make_suite_icon(emblem, 1024, suite_type='admin', is_round=False)

    app_icon_cust.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-customer-1024.png"), optimize=True)
    app_icon_part.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-partner-1024.png"), optimize=True)
    app_icon_admin.save(os.path.join(BRAND_ASSETS_DIR, "dinedeck-admin-1024.png"), optimize=True)

    # 2. DEPLOY TO WEB PLATFORMS
    web_configs = [
        ("customer-web", "customer"),
        ("partner-web", "partner"),
        ("admin-web", "admin"),
    ]

    for app_dir_name, suite_type in web_configs:
        pub_dir = os.path.join(ROOT_DIR, app_dir_name, "public")
        ensure_dir(pub_dir)
        print(f"Deploying web assets to: {pub_dir} ({suite_type})")

        # Website Favicons: 100% transparent background, pure emblem only
        # Zero colored boxes, backgrounds, borders, padding, or containers (GitHub / YouTube / ChatGPT style)
        generate_transparent_favicon_ico(emblem, os.path.join(pub_dir, "favicon.ico"))
        make_pure_transparent_favicon(emblem, 32).save(os.path.join(pub_dir, "favicon.png"), optimize=True)
        with open(os.path.join(pub_dir, "favicon.svg"), "w", encoding="utf-8") as f:
            f.write(svg_favicon)

        # Apple Touch Icon & PWA Icons
        make_suite_icon(emblem, 180, suite_type=suite_type, is_round=False).save(os.path.join(pub_dir, "apple-touch-icon.png"), optimize=True)
        make_suite_icon(emblem, 192, suite_type=suite_type, is_round=False).save(os.path.join(pub_dir, "icon-192.png"), optimize=True)
        make_suite_icon(emblem, 512, suite_type=suite_type, is_round=False).save(os.path.join(pub_dir, "icon-512.png"), optimize=True)
        make_suite_icon(emblem, 192, suite_type=suite_type, is_round=False).save(os.path.join(pub_dir, "logo192.png"), optimize=True)
        make_suite_icon(emblem, 512, suite_type=suite_type, is_round=False).save(os.path.join(pub_dir, "logo512.png"), optimize=True)

        # Full Logos & Emblems
        full_logo_light.save(os.path.join(pub_dir, "dinedeck-logo.png"), optimize=True)
        full_logo_dark.save(os.path.join(pub_dir, "dinedeck-logo-dark.png"), optimize=True)
        emblem_512.save(os.path.join(pub_dir, "dinedeck-emblem.png"), optimize=True)

        # SVGs
        with open(os.path.join(pub_dir, "dinedeck-emblem.svg"), "w", encoding="utf-8") as f:
            f.write(svg_emblem)
        with open(os.path.join(pub_dir, "dinedeck-logo-dark.svg"), "w", encoding="utf-8") as f:
            f.write(svg_logo_dark)
        with open(os.path.join(pub_dir, "dinedeck-logo.svg"), "w", encoding="utf-8") as f:
            f.write(svg_logo_light)

    # 3. DEPLOY TO WINDOWS DESKTOP
    desktop_configs = [
        ("desktop-partner", "partner"),
        ("desktop-admin", "admin"),
    ]

    for d_dir_name, suite_type in desktop_configs:
        assets_dir = os.path.join(ROOT_DIR, d_dir_name, "assets")
        ensure_dir(assets_dir)
        print(f"Deploying desktop assets to: {assets_dir} ({suite_type})")

        # Multi-resolution .ico for Windows Executable & Installer
        generate_desktop_ico(emblem, suite_type, os.path.join(assets_dir, "icon.ico"))
        make_suite_icon(emblem, 512, suite_type=suite_type, is_round=False).save(os.path.join(assets_dir, "icon.png"), optimize=True)
        emblem_512.save(os.path.join(assets_dir, "dinedeck-emblem.png"), optimize=True)
        full_logo_dark.save(os.path.join(assets_dir, "dinedeck-logo-dark.png"), optimize=True)

    # 4. DEPLOY TO ANDROID APPLICATIONS
    android_configs = [
        ("app", "customer"),
        ("partner-app", "partner"),
        ("admin-app", "admin"),
    ]

    android_densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    for a_module, suite_type in android_configs:
        res_dir = os.path.join(ROOT_DIR, a_module, "src", "main", "res")
        print(f"Deploying Android launcher icons to: {res_dir} ({suite_type})")

        for folder, d_size in android_densities.items():
            f_dir = os.path.join(res_dir, folder)
            ensure_dir(f_dir)
            make_suite_icon(emblem, d_size, suite_type=suite_type, is_round=False).save(os.path.join(f_dir, "ic_launcher.png"), optimize=True)
            make_suite_icon(emblem, d_size, suite_type=suite_type, is_round=True).save(os.path.join(f_dir, "ic_launcher_round.png"), optimize=True)

        draw_dir = os.path.join(res_dir, "drawable")
        ensure_dir(draw_dir)
        emblem_512.save(os.path.join(draw_dir, "dinedeck_emblem.png"), optimize=True)
        full_logo_dark.save(os.path.join(draw_dir, "dinedeck_logo_dark.png"), optimize=True)

        fg_icon = make_suite_icon(emblem, 432, suite_type=suite_type, is_round=False)
        fg_icon.save(os.path.join(draw_dir, "ic_launcher_foreground_asset.png"), optimize=True)

    # 5. DEPLOY TO DOCS / BRAND PORTFOLIO
    docs_favicons = os.path.join(ROOT_DIR, "docs", "assets", "brand", "favicons")
    ensure_dir(docs_favicons)
    print("Deploying docs pure transparent favicons...")
    for s in [16, 32, 48, 64]:
        fav_img = make_pure_transparent_favicon(emblem, s)
        fav_img.save(os.path.join(docs_favicons, f"favicon_{s}x{s}.png"), optimize=True)
        fav_img.save(os.path.join(docs_favicons, f"favicon_admin_{s}x{s}.png"), optimize=True)
        fav_img.save(os.path.join(docs_favicons, f"favicon_partner_{s}x{s}.png"), optimize=True)

    docs_desktop = os.path.join(ROOT_DIR, "docs", "assets", "brand", "desktop")
    ensure_dir(docs_desktop)
    generate_desktop_ico(emblem, "admin", os.path.join(docs_desktop, "dinedeck_admin.ico"))
    generate_desktop_ico(emblem, "partner", os.path.join(docs_desktop, "dinedeck_partner.ico"))
    generate_desktop_ico(emblem, "customer", os.path.join(docs_desktop, "dinedeck_app.ico"))

    docs_icons = os.path.join(ROOT_DIR, "docs", "assets", "brand", "icons")
    ensure_dir(docs_icons)
    app_icon_cust.save(os.path.join(docs_icons, "dinedeck_customer_1024.png"), optimize=True)
    app_icon_cust.save(os.path.join(docs_icons, "dinedeck_primary_1024.png"), optimize=True)
    app_icon_part.save(os.path.join(docs_icons, "dinedeck_partner_1024.png"), optimize=True)
    app_icon_admin.save(os.path.join(docs_icons, "dinedeck_admin_1024.png"), optimize=True)

    docs_pwa = os.path.join(ROOT_DIR, "docs", "assets", "brand", "pwa")
    ensure_dir(docs_pwa)
    for s in [72, 96, 128, 144, 152, 192, 384, 512]:
        make_suite_icon(emblem, s, suite_type='customer', is_round=False).save(os.path.join(docs_pwa, f"icon_{s}x{s}.png"), optimize=True)
        make_suite_icon(emblem, s, suite_type='partner', is_round=False).save(os.path.join(docs_pwa, f"partner_{s}x{s}.png"), optimize=True)
        make_suite_icon(emblem, s, suite_type='admin', is_round=False).save(os.path.join(docs_pwa, f"admin_{s}x{s}.png"), optimize=True)

    print("\n[SUCCESS] Universal DineDeck Brand Assets and Transparent Website Favicons generated and deployed!")

if __name__ == "__main__":
    main()
