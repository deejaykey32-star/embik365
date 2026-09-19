import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
import requests

# 1. Pobieranie profesjonalnej czcionki
font_path = "Roboto-Bold.ttf"
font_regular_path = "Roboto-Regular.ttf"

def download_font(url, path):
    if not os.path.exists(path):
        print(f"Pobieranie czcionki: {path}...")
        r = requests.get(url)
        with open(path, 'wb') as f:
            f.write(r.content)

download_font("https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf", font_path)
download_font("https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf", font_regular_path)

# 2. Parametry generatora (zwiększona wysokość)
WIDTH, HEIGHT = 800, 1100
BG_COLOR = (255, 255, 255)       # Biały
TEXT_COLOR = (0, 0, 0)           # Czarny (użyty m.in. do przycisku)
BOX_COLOR = (245, 245, 245)      # Bardzo jasnoszary
BORDER_COLOR = (50, 50, 50)      # Ciemnoszary dla tekstów pomocniczych

def create_beautiful_qr_card(title, subtitle, short_url, target_desc, footer, filename):
    img = Image.new('RGB', (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Ładowanie czcionek
    font_title = ImageFont.truetype(font_path, 42)
    font_sub = ImageFont.truetype(font_regular_path, 24)
    font_cta = ImageFont.truetype(font_path, 26) # Czcionka dla przycisku CTA
    font_box_title = ImageFont.truetype(font_path, 20)
    font_url = ImageFont.truetype(font_path, 32)
    font_desc = ImageFont.truetype(font_regular_path, 18)
    font_footer = ImageFont.truetype(font_regular_path, 20)
    
    # Podwójna ramka wokół karty
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], outline=BORDER_COLOR, width=3)
    draw.rectangle([30, 30, WIDTH-30, HEIGHT-30], outline=BORDER_COLOR, width=1)
    
    # Nagłówek
    draw.text((WIDTH/2, 90), title.upper(), fill=TEXT_COLOR, font=font_title, anchor="mm")
    draw.text((WIDTH/2, 140), subtitle, fill=BORDER_COLOR, font=font_sub, anchor="mm")
    
    # Linia separująca
    draw.line([(150, 170), (WIDTH-150, 170)], fill=BOX_COLOR, width=2)
    
    # Generowanie kodu QR
    qr = qrcode.QRCode(box_size=12, border=2)
    qr.add_data(short_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_img = qr_img.resize((450, 450))
    
    # Ramka wokół QR
    qr_bg = Image.new('RGB', (490, 490), color=(250, 250, 250))
    draw_qr_bg = ImageDraw.Draw(qr_bg)
    draw_qr_bg.rectangle([0, 0, 489, 489], outline=BOX_COLOR, width=2)
    qr_bg.paste(qr_img, (20, 20))
    img.paste(qr_bg, (int((WIDTH - 490)/2), 190))
    
    # --- PRZYCISK CTA (Call To Action) ---
    cta_y1, cta_y2 = 710, 780
    cta_x1, cta_x2 = 120, WIDTH-120
    try:
        # Próba narysowania zaokrąglonego przycisku (dla nowszych wersji Pillow)
        draw.rounded_rectangle([cta_x1, cta_y1, cta_x2, cta_y2], radius=35, fill=TEXT_COLOR)
    except AttributeError:
        # Zastępstwo dla starszych wersji
        draw.rectangle([cta_x1, cta_y1, cta_x2, cta_y2], fill=TEXT_COLOR)
    
    # Tekst na przycisku CTA (biały na czarnym tle)
    draw.text((WIDTH/2, 745), "➤ KLIKNIJ TUTAJ LUB ZESKANUJ KOD", fill=BG_COLOR, font=font_cta, anchor="mm")
    # ------------------------------------
    
    # Box na dole z adresami URL (przesunięty niżej ze względu na CTA)
    box_y1, box_y2 = 820, 960
    box_x1, box_x2 = 60, WIDTH-60
    draw.rectangle([box_x1, box_y1, box_x2, box_y2], fill=BOX_COLOR, outline=BORDER_COLOR, width=1)
    
    draw.text((WIDTH/2, 855), "SKRÓCONY ADRES PRZEKIEROWANIA:", fill=BORDER_COLOR, font=font_box_title, anchor="mm")
    draw.text((WIDTH/2, 895), short_url, fill=TEXT_COLOR, font=font_url, anchor="mm")
    draw.text((WIDTH/2, 935), f"Cel docelowy: {target_desc}", fill=BORDER_COLOR, font=font_desc, anchor="mm")
    
    # Stopka
    draw.line([(80, HEIGHT-80), (WIDTH-80, HEIGHT-80)], fill=BOX_COLOR, width=2)
    draw.text((WIDTH/2, HEIGHT-50), footer, fill=BORDER_COLOR, font=font_footer, anchor="mm")
    
    # Zapis
    img.save(filename)
    print(f"Wygenerowano kartę z CTA: {filename}")

# TEST
create_beautiful_qr_card(
    title="WnR365 - Dzień 1",
    subtitle="Droga365 • Duchowy Dziennik i Notatnik",
    short_url="https://wnr365.pages.dev/w/1/tekst",
    target_desc="Tekst i Komentarz AI (Platforma eMBiK)",
    footer="Widoki na Raj • RHZ • Biblia • E-book • www.widokinaraj.pl",
    filename="Karta_Testowa_CTA.png"
)