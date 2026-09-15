import json, sys, math
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib.dates as mdates

W = H = 1080

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
F_BLACK = FONT_DIR + "DejaVuSans-Bold.ttf"
F_REG   = FONT_DIR + "DejaVuSans.ttf"
F_LIGHT = FONT_DIR + "DejaVuSans-ExtraLight.ttf"
F_MONO  = FONT_DIR + "DejaVuSansMono-Bold.ttf"

BG_TOP = (10, 12, 23)
BG_BOT = (18, 22, 41)
CARD_BG = (24, 28, 48)
CARD_BORDER = (46, 52, 82)
TXT_MAIN = (245, 246, 250)
TXT_DIM = (150, 156, 182)
GREEN = (58, 230, 158)
RED = (255, 90, 110)
GOLD = (255, 199, 80)
CYAN = (66, 214, 255)
PINK = (255, 92, 168)

def font(path, size):
    return ImageFont.truetype(path, size)

def vertical_gradient(w, h, top, bot):
    base = Image.new("RGB", (w, h), top)
    top_a = Image.new("RGB", (w, h), top)
    bot_a = Image.new("RGB", (w, h), bot)
    mask = Image.new("L", (w, h))
    mdata = []
    for y in range(h):
        mdata.extend([int(255 * (y / h))] * w)
    mask.putdata(mdata)
    base = Image.composite(bot_a, top_a, mask)
    return base

def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def text_w(draw, s, f):
    b = draw.textbbox((0,0), s, font=f)
    return b[2]-b[0], b[3]-b[1]

def draw_center(draw, cx, y, s, f, fill, anchor_mid=True):
    w, h = text_w(draw, s, f)
    draw.text((cx - w/2, y), s, font=f, fill=fill)
    return w, h

def fmt_bs(v):
    s = f"{v:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return s

def fmt_pct(v, signed=True):
    sign = "+" if v > 0 else ("" if v == 0 else "-")
    return f"{sign}{abs(v):.2f}%"

def arrow_glyph(delta):
    if delta > 0.0001: return "▲", GREEN
    if delta < -0.0001: return "▼", RED
    return "▬", TXT_DIM

def stat_card(img, draw, x, y, w, h, label, value_str, sub, delta, accent, big=False):
    rounded_rect(draw, [x, y, x+w, y+h], 28, fill=CARD_BG, outline=CARD_BORDER, width=2)
    pad = 40
    f_label = font(F_BLACK, 30)
    f_value = font(F_BLACK, 78 if not big else 96)
    f_sub = font(F_REG, 26)
    f_delta = font(F_BLACK, 32)

    draw.text((x+pad, y+30), label, font=f_label, fill=TXT_DIM)

    vw, vh = text_w(draw, value_str, f_value)
    draw.text((x+pad, y+h/2-vh/2+6), value_str, font=f_value, fill=accent)

    if delta is not None:
        glyph, gcol = arrow_glyph(delta)
        dtxt = f"{glyph} {fmt_pct(delta)}"
        dw, dh = text_w(draw, dtxt, f_delta)
        draw.text((x+w-pad-dw, y+30), dtxt, font=f_delta, fill=gcol)

    draw.text((x+pad, y+h-pad-24), sub, font=f_sub, fill=TXT_DIM)

def slide1(data, out_path):
    img = vertical_gradient(W, H, BG_TOP, BG_BOT)
    draw = ImageDraw.Draw(img)

    # subtle top glow
    glow = Image.new("RGBA", (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W/2-500, -400, W/2+500, 300], fill=(58,230,158,26))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img.paste(Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB"), (0,0))
    draw = ImageDraw.Draw(img)

    f_kicker = font(F_BLACK, 30)
    f_title = font(F_BLACK, 64)
    f_date = font(F_REG, 30)

    draw.text((60, 64), "VENEZUELA · HOY", font=f_kicker, fill=GOLD)
    draw.text((60, 108), "Tipo de Cambio", font=f_title, fill=TXT_MAIN)
    draw.text((60, 186), data["date_label"], font=f_date, fill=TXT_DIM)

    y0 = 260
    gap = 26
    ch = 230
    stat_card(img, draw, 60, y0, W-120, ch, "OFICIAL BCV (USD)",
              f"Bs. {fmt_bs(data['bcv']['value'])}", f"Vigente {data['bcv']['date']}",
              data['bcv']['delta_pct'], CYAN)

    y1 = y0 + ch + gap
    stat_card(img, draw, 60, y1, W-120, ch, "PARALELO (USD)",
              f"Bs. {fmt_bs(data['paralelo']['value'])}", f"Vigente {data['paralelo']['date']}",
              data['paralelo']['delta_pct'], PINK)

    y2 = y1 + ch + gap
    ch2 = H - y2 - 100
    rounded_rect(draw, [60, y2, W-60, y2+ch2], 28, fill=(40, 30, 16), outline=(90, 70, 24), width=2)
    f_label = font(F_BLACK, 30)
    f_value = font(F_BLACK, 72)
    f_sub = font(F_REG, 26)
    draw.text((60+40, y2+26), "BRECHA CAMBIARIA", font=f_label, fill=(214, 178, 110))
    bv = f"{data['brecha_pct']:.1f}%"
    value_y = y2+78
    _, vh = text_w(draw, bv, f_value)
    draw.text((60+40, value_y), bv, font=f_value, fill=GOLD)
    sub = "Cuánto más caro es el dólar paralelo frente al oficial"
    draw.text((60+40, value_y+vh+34), sub, font=f_sub, fill=(180,160,120))

    f_foot = font(F_BLACK, 30)
    draw.text((60, H-64), "finiq.propiqla.com", font=f_foot, fill=TXT_MAIN)
    f_foot2 = font(F_REG, 24)
    fw,_ = text_w(draw, "Fuente: BCV · datos reales, sin estimaciones", f_foot2)
    draw.text((W-60-fw, H-60), "Fuente: BCV · datos reales, sin estimaciones", font=f_foot2, fill=TXT_DIM)

    img.save(out_path, quality=95)

def slide2(data, out_path):
    hist = data["history"]
    dates_bcv = [datetime.strptime(d, "%Y-%m-%d") for d,v in hist["bcv"]]
    vals_bcv = [v for d,v in hist["bcv"]]
    dates_par = [datetime.strptime(d, "%Y-%m-%d") for d,v in hist["paralelo"]]
    vals_par = [v for d,v in hist["paralelo"]]

    all_dates = dates_bcv + dates_par
    xmin, xmax = min(all_dates), max(all_dates)
    xpad = (xmax - xmin) * 0.12

    CHART_H_PX = 430
    fig = plt.figure(figsize=(10.8, CHART_H_PX/100), dpi=100)
    fig.patch.set_facecolor("#0A0C17")
    ax = fig.add_axes([0.10, 0.16, 0.78, 0.74])
    ax.set_facecolor("#0A0C17")

    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.grid(axis="y", color="#242A45", linewidth=1, alpha=0.7)
    ax.tick_params(colors="#8E94B8", labelsize=15)
    ax.set_xlim(xmin - xpad*0.3, xmax + xpad)

    ax.plot(dates_bcv, vals_bcv, color="#42D6FF", linewidth=4.5, solid_capstyle="round", label="Oficial BCV")
    ax.plot(dates_par, vals_par, color="#FF5CA8", linewidth=4.5, solid_capstyle="round", label="Paralelo")

    ax.scatter([dates_bcv[-1]], [vals_bcv[-1]], color="#42D6FF", s=110, zorder=5, edgecolor="#0A0C17", linewidth=2)
    ax.scatter([dates_par[-1]], [vals_par[-1]], color="#FF5CA8", s=110, zorder=5, edgecolor="#0A0C17", linewidth=2)

    ax.annotate(f"Bs.{vals_bcv[-1]:,.0f}", (dates_bcv[-1], vals_bcv[-1]), xytext=(12, -4),
                textcoords="offset points", color="#42D6FF", fontsize=18, fontweight="bold", va="center")
    ax.annotate(f"Bs.{vals_par[-1]:,.0f}", (dates_par[-1], vals_par[-1]), xytext=(12, -4),
                textcoords="offset points", color="#FF5CA8", fontsize=18, fontweight="bold", va="center")

    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=6))
    for label in ax.get_xticklabels():
        label.set_ha("center")
        label.set_rotation(0)

    fig.savefig("/tmp/_chart_raw.png", facecolor=fig.get_facecolor())
    plt.close(fig)

    # Compose full branded slide with PIL
    img = vertical_gradient(W, H, BG_TOP, BG_BOT)
    draw = ImageDraw.Draw(img)

    f_kicker = font(F_BLACK, 30)
    f_title = font(F_BLACK, 58)
    f_date = font(F_REG, 28)
    draw.text((60, 64), "VENEZUELA · ÚLTIMOS 30 DÍAS", font=f_kicker, fill=GOLD)
    draw.text((60, 108), "Tendencia del Dólar", font=f_title, fill=TXT_MAIN)
    draw.text((60, 180), data["date_label"], font=f_date, fill=TXT_DIM)

    CHART_Y = 240
    chart = Image.open("/tmp/_chart_raw.png").convert("RGB")
    img.paste(chart, (0, CHART_Y))
    draw = ImageDraw.Draw(img)

    # legend chips (above chart, right under title)
    f_leg = font(F_BLACK, 26)
    lx = 60
    ly = CHART_Y - 6
    draw.ellipse([lx, ly+4, lx+20, ly+24], fill=CYAN)
    draw.text((lx+30, ly), "Oficial BCV", font=f_leg, fill=TXT_MAIN)
    lx2 = lx + 240
    draw.ellipse([lx2, ly+4, lx2+20, ly+24], fill=PINK)
    draw.text((lx2+30, ly), "Paralelo", font=f_leg, fill=TXT_MAIN)

    # brecha trend mini box
    by = CHART_Y + CHART_H_PX + 30
    bh = H - by - 110
    rounded_rect(draw, [60, by, W-60, by+bh], 28, fill=CARD_BG, outline=CARD_BORDER, width=2)
    f_l = font(F_BLACK, 26)
    f_v = font(F_BLACK, 58)
    f_s = font(F_REG, 24)
    draw.text((60+40, by+22), "BRECHA HOY", font=f_l, fill=TXT_DIM)
    bv = f"{data['brecha_pct']:.1f}%"
    draw.text((60+40, by+58), bv, font=f_v, fill=GOLD)

    draw.text((60+40, by+bh-70), f"Hace 30 días: {data['brecha_30d_ago_pct']:.1f}%", font=f_s, fill=TXT_DIM)
    trend_txt = "en aumento" if data['brecha_pct'] > data['brecha_30d_ago_pct'] else "en descenso"
    tcol = RED if data['brecha_pct'] > data['brecha_30d_ago_pct'] else GREEN
    draw.text((60+40, by+bh-36), f"La brecha está {trend_txt}", font=f_s, fill=tcol)

    f_foot = font(F_BLACK, 30)
    draw.text((60, H-64), "finiq.propiqla.com", font=f_foot, fill=TXT_MAIN)
    f_foot2 = font(F_REG, 24)
    fw,_ = text_w(draw, "Fuente: BCV · datos reales, sin estimaciones", f_foot2)
    draw.text((W-60-fw, H-60), "Fuente: BCV · datos reales, sin estimaciones", font=f_foot2, fill=TXT_DIM)

    img.save(out_path, quality=95)

MESES_ES = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

def fecha_es(d):
    y, m, dd = d.split("-")
    return f"{int(dd)} {MESES_ES[int(m)]} {y}"

def nearest(rows, target_dt):
    """rows: list of (date_str, value) sorted ascending. Return the entry whose date is closest to target_dt."""
    best = None
    best_diff = None
    for d, v in rows:
        dt = datetime.strptime(d, "%Y-%m-%d")
        diff = abs((dt - target_dt).days)
        if best_diff is None or diff < best_diff:
            best_diff = diff
            best = (d, v)
    return best

def compute_data(rows, today_str):
    """rows: raw list of {rate_type, base_currency, effective_date, rate} dicts from
    banking.exchange_rates (bcv_oficial + paralelo_referencial, base_currency USD).
    today_str: 'YYYY-MM-DD' for the run date (used only as the display label)."""
    bcv = sorted({(r["effective_date"], float(r["rate"])) for r in rows if r["rate_type"] == "bcv_oficial"})
    par = sorted({(r["effective_date"], float(r["rate"])) for r in rows if r["rate_type"] == "paralelo_referencial"})
    if not bcv or not par:
        raise ValueError("Missing bcv_oficial or paralelo_referencial rows — refusing to render with incomplete real data.")

    bcv_latest, bcv_prev = bcv[-1], (bcv[-2] if len(bcv) > 1 else bcv[-1])
    par_latest, par_prev = par[-1], (par[-2] if len(par) > 1 else par[-1])

    bcv_delta = (bcv_latest[1] - bcv_prev[1]) / bcv_prev[1] * 100
    par_delta = (par_latest[1] - par_prev[1]) / par_prev[1] * 100
    brecha = (par_latest[1] - bcv_latest[1]) / bcv_latest[1] * 100

    today_dt = datetime.strptime(today_str, "%Y-%m-%d")
    target_30 = today_dt.replace(day=1)  # placeholder, overwritten below
    from datetime import timedelta
    target_30 = today_dt - timedelta(days=30)
    bcv_30 = nearest(bcv, target_30)
    par_30 = nearest(par, target_30)
    brecha_30 = (par_30[1] - bcv_30[1]) / bcv_30[1] * 100

    return {
        "date_label": fecha_es(today_str),
        "bcv": {"value": bcv_latest[1], "date": fecha_es(bcv_latest[0]), "delta_pct": bcv_delta},
        "paralelo": {"value": par_latest[1], "date": fecha_es(par_latest[0]), "delta_pct": par_delta},
        "brecha_pct": brecha,
        "brecha_30d_ago_pct": brecha_30,
        "history": {"bcv": bcv, "paralelo": par},
    }

if __name__ == "__main__":
    data_path = sys.argv[1]
    out_dir = sys.argv[2]
    with open(data_path) as f:
        payload = json.load(f)

    if isinstance(payload, list):
        # Raw Supabase rows — today's date defaults to the 3rd CLI arg, else system date.
        today_str = sys.argv[3] if len(sys.argv) > 3 else datetime.now().strftime("%Y-%m-%d")
        data = compute_data(payload, today_str)
    else:
        data = payload

    slide1(data, out_dir + "/slide1_rates.png")
    slide2(data, out_dir + "/slide2_trend.png")
    print("done")
