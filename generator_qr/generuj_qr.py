import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
import shutil
import requests

# Konfiguracja
base_url = "https://wnr365.pages.dev"
output_dir = "Wygenerowane_Kody_QR_Estetyczne"

# Pobieranie czcionek (jeśli brak)
font_path = "Roboto-Bold.ttf"
font_regular_path = "Roboto-Regular.ttf"

def download_font(url, path):
    if not os.path.exists(path):
        r = requests.get(url)
        with open(path, 'wb') as f:
            f.write(r.content)

download_font("https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf", font_path)
download_font("https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf", font_regular_path)

# Parametry karty
WIDTH, HEIGHT = 800, 1100
BG_COLOR, TEXT_COLOR = (255, 255, 255), (0, 0, 0)
BOX_COLOR, BORDER_COLOR = (245, 245, 245), (50, 50, 50)
FOOTER_TEXT = "Widoki na Raj • RHZ • Biblia • E-book • www.widokinaraj.pl"

def create_beautiful_qr_card(title, subtitle, short_url, target_desc, folder, filename):
    folder_path = os.path.join(output_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    img = Image.new('RGB', (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    font_title = ImageFont.truetype(font_path, 42)
    font_sub = ImageFont.truetype(font_regular_path, 24)
    font_cta = ImageFont.truetype(font_path, 26)
    font_box_title = ImageFont.truetype(font_path, 20)
    font_url = ImageFont.truetype(font_path, 32)
    font_desc = ImageFont.truetype(font_regular_path, 18)
    font_footer = ImageFont.truetype(font_regular_path, 20)
    
    # Ramki
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], outline=BORDER_COLOR, width=3)
    draw.rectangle([30, 30, WIDTH-30, HEIGHT-30], outline=BORDER_COLOR, width=1)
    
    # Teksty górne
    draw.text((WIDTH/2, 90), title.upper(), fill=TEXT_COLOR, font=font_title, anchor="mm")
    draw.text((WIDTH/2, 140), subtitle, fill=BORDER_COLOR, font=font_sub, anchor="mm")
    draw.line([(150, 170), (WIDTH-150, 170)], fill=BOX_COLOR, width=2)
    
    # QR Kod
    qr = qrcode.QRCode(box_size=12, border=2)
    qr.add_data(short_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").resize((450, 450))
    
    qr_bg = Image.new('RGB', (490, 490), color=(250, 250, 250))
    draw_qr_bg = ImageDraw.Draw(qr_bg)
    draw_qr_bg.rectangle([0, 0, 489, 489], outline=BOX_COLOR, width=2)
    qr_bg.paste(qr_img, (20, 20))
    img.paste(qr_bg, (int((WIDTH - 490)/2), 190))
    
    # CTA
    try:
        draw.rounded_rectangle([120, 710, WIDTH-120, 780], radius=35, fill=TEXT_COLOR)
    except AttributeError:
        draw.rectangle([120, 710, WIDTH-120, 780], fill=TEXT_COLOR)
    draw.text((WIDTH/2, 745), "➤ KLIKNIJ TUTAJ LUB ZESKANUJ KOD", fill=BG_COLOR, font=font_cta, anchor="mm")
    
    # Box z adresami
    draw.rectangle([60, 820, WIDTH-60, 960], fill=BOX_COLOR, outline=BORDER_COLOR, width=1)
    draw.text((WIDTH/2, 855), "SKRÓCONY ADRES PRZEKIEROWANIA:", fill=BORDER_COLOR, font=font_box_title, anchor="mm")
    draw.text((WIDTH/2, 895), short_url, fill=TEXT_COLOR, font=font_url, anchor="mm")
    draw.text((WIDTH/2, 935), f"Cel docelowy: {target_desc}", fill=BORDER_COLOR, font=font_desc, anchor="mm")
    
    # Stopka
    draw.line([(80, HEIGHT-80), (WIDTH-80, HEIGHT-80)], fill=BOX_COLOR, width=2)
    draw.text((WIDTH/2, HEIGHT-50), FOOTER_TEXT, fill=BORDER_COLOR, font=font_footer, anchor="mm")
    
    # Zapis
    img.save(os.path.join(folder_path, filename))

print("Rozpoczynam generowanie ponad 2400 kart QR. To zajmie około 1-3 minuty...\n")

# 1. Biblia
print("1/5: Biblia (1460)...")
for i in range(1, 1461):
    create_beautiful_qr_card(f"BIBLIA - DZIEŃ {i}", "Czytanie i komentarz AI", f"{base_url}/b/{i}", "Komentarz (Platforma eMBiK)", "1_Biblia", f"Biblia_{i:04d}.png")

# 2. WnR365 Tekst
print("2/5: WnR365 Tekst (365)...")
for i in range(1, 366):
    create_beautiful_qr_card(f"WnR365 - DZIEŃ {i}", "Droga365 • Wpis na blogu", f"{base_url}/w/{i}/tekst", "Dziennik (Platforma eMBiK)", "2_WnR_Tekst", f"WnR_Tekst_{i:03d}.png")

# 3. WnR365 YouTube
print("3/5: WnR365 Audio/Wideo (365)...")
for i in range(1, 366):
    create_beautiful_qr_card(f"WnR365 AUDIO - DZIEŃ {i}", "Droga365 • Wersja Audio", f"{base_url}/w/{i}/yt", "Materiał Wideo (YouTube)", "3_WnR_YouTube", f"WnR_YT_{i:03d}.png")

# 4. RHZ
print("4/5: RHZ (177)...")
create_beautiful_qr_card("RHZ - WSTĘP", "Różaniec Historii Zbawienia", f"{base_url}/r/wstep", "Wstęp (YouTube)", "4_RHZ", "RHZ_000_Wstep.png")
for i in range(1, 176):
    create_beautiful_qr_card(f"RHZ - DZIEŃ {i}", "Różaniec Historii Zbawienia", f"{base_url}/r/{i}", f"Dzień {i} (YouTube)", "4_RHZ", f"RHZ_{i:03d}.png")
create_beautiful_qr_card("RHZ - KORONKA", "Koronka do Miłosierdzia", f"{base_url}/r/koronka", "Koronka (YouTube)", "4_RHZ", "RHZ_176_Koronka.png")

# 5. Zasoby Wewnętrzne
print("5/5: Zasoby Wewnętrzne (100)...")
for i in range(1, 101):
    create_beautiful_qr_card(f"MATERIAŁ DODATKOWY {i}", "Zasób do wpisu", f"{base_url}/z/{i}", "Zasób zewnętrzny (GitHub/YT)", "5_Zasoby", f"Zasob_{i:03d}.png")

print("\nPakowanie do pliku ZIP...")
shutil.make_archive("WidokiNaRaj_QR_Karty", 'zip', output_dir)
print("\nGotowe! Pobierz plik 'WidokiNaRaj_QR_Karty.zip'.")