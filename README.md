# BurgerMash 🍔

Elle ezilen burger konseptiyle yapılmış, **uçtan uca bir full stack sipariş uygulaması**: animasyonlu bir vitrin, gerçek zamanlı sipariş takibi, mutfak ekranı ve admin paneli.

> **Kurgusal bir portföy projesidir.** Markası, menüsü ve fiyatları uydurmadır; gerçek ödeme alınmaz, gerçek sipariş hazırlanmaz.

## Neler var?

**Müşteri**
- Animasyonlu açılış, kaydırmayla ayrışan burger, 3B eğilen kartlar (Framer Motion + Lenis)
- **Türkçe / İngilizce** arayüz (tarayıcı diline göre otomatik, dil düğmesiyle değiştirilebilir). Sepet ve sipariş detayları ham seçimlerden seçili dilde üretilir
- 29 ürünlük menü: kategori filtresi, arama, favoriler, **vegan / vejetaryen / acılı filtreleri**, kalori ve alerjen bilgisi
- Ürün detay penceresi: **malzeme çıkar, ekstra ve sos ekle, tek burger ya da menü** (patates + içecek) seç
- "Kendin tasarla": köfte sayısı ve malzemelerle canlı burger oluşturucu
- Sepet ("yanına ekle" önerileri), promosyon kodu, teslimat / gel-al, **WebSocket ile canlı sipariş takibi**
- **PWA**: telefona uygulama gibi eklenebilir, çevrimdışıyken önbellekten açılır
- Kayıt/giriş, sipariş geçmişi, "tekrar sipariş ver"

**Personel**
- **Mutfak ekranı** (`/mutfak`): yeni sipariş anında düşer (sesli bildirim), durumlar düğmeyle ilerletilir
- **Admin paneli** (`/admin`): fiyat ve stok değişikliği anında menüye yansır

## Teknoloji

| Katman | Teknoloji |
|---|---|
| Ön yüz | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lenis |
| Arka yüz | NestJS 12 (modüler monolit), TypeScript, Prisma 7, socket.io, JWT, class-validator, Swagger |
| Veritabanı | PostgreSQL |
| Test | Vitest (birim + API e2e), Playwright (tarayıcı e2e) |
| Altyapı | Docker Compose, GitHub Actions, Vercel + Render + Neon (ücretsiz katmanlar) |

## Mimari

```mermaid
flowchart LR
  subgraph Tarayıcı
    W["Next.js<br/>React · Framer Motion"]
  end
  subgraph API["NestJS — modüler monolit"]
    direction TB
    AU[Auth<br/>JWT + roller]
    ME[Menu]
    OR["Orders<br/>sunucu tarafı fiyatlandırma"]
    GW["WebSocket<br/>Gateway"]
  end
  DB[("PostgreSQL")]
  W -- "REST + Bearer JWT" --> API
  W <-- "socket.io" --> GW
  API -- "Prisma" --> DB
  OR --> GW
```

### Önemli tasarım kararları

- **Fiyat her zaman sunucuda hesaplanır.** İstemci yalnızca ham seçimleri gönderir (ürün, malzemeler, soslar…). Fiyat alanı gönderilirse istek reddedilir. Kurallar saf fonksiyonlarda ([`api/src/orders/pricing.ts`](api/src/orders/pricing.ts)) olduğu için veritabanı olmadan test edilir.
- **Durum makinesi:** `Alındı → Hazırlanıyor → Yolda → Teslim edildi` (ya da iptal). Geri dönmek veya atlamak reddedilir.
- **Gerçek zamanlı kanal gizliliği:** Mutfak odası tüm siparişi (adres, telefon) görür; müşteri odası yalnızca kendi siparişinin, kişisel veriler çıkarılmış hâlini alır.
- **Modüler monolit:** Auth, Menu ve Orders modülleri ayrı; ileride servislere ayrılabilir. Ücretsiz hosting'de tek süreç olarak çalıştırmak çok daha basit.
- **Zarif bozulma:** API'ye ulaşılamazsa ön yüz yerleşik örnek menüyle açılır ve bunu belirtir (ücretsiz sunucular uyuyabilir).
- **Erişilebilirlik:** Lighthouse erişilebilirlik ve SEO skoru 100. Kartlarda iç içe etkileşimli öğe yok (başlık gerçek bir düğme), kontrast oranları WCAG AA, klavye ve ekran okuyucu uyumlu etiketler.
- **Çeviri mimarisi:** Metinler tipli sözlüklerde (`web/lib/dict`); İngilizce'de eksik anahtar derleme hatası verir. Menü içeriğinin çevirisi ayrı bir dosyada, çevirisi olmayan yeni ürünler Türkçe kalır.
- **Güvenlik:** bcrypt, JWT, rol tabanlı yetki, DTO doğrulaması (`whitelist` + `forbidNonWhitelisted`), `helmet`, hız sınırı (giriş/kayıt daha sıkı), CORS izin listesi.
  - *Not:* Token `localStorage`'da tutulur. Portföy için yeterli ve basit; gerçek bir üründe `httpOnly` çerez ve CSRF koruması tercih edilirdi.

## Yerelde çalıştırma

### A) Docker ile (tek komut)

```bash
docker compose up --build
```

Site: <http://localhost:3000> · API: <http://localhost:4000> · Swagger: <http://localhost:4000/docs>

### B) Docker'sız (geliştirme)

Gereksinim: Node.js 22+. PostgreSQL için gömülü bir sürüm kullanılır, ayrıca kurulum gerekmez.

```bash
# 1) Veritabanı (gömülü PostgreSQL, 5433 portu) — ayrı bir terminalde açık kalır
cd api && npm install && npm run db:dev

# 2) API: ortam dosyası, migrasyon, seed, sunucu — ayrı bir terminalde
cd api
cp .env.example .env
npm run db:migrate
npm run db:seed            # Prisma istemcisini de üretir
npm run start:dev          # http://localhost:4000

# 3) Web — ayrı bir terminalde
cd web && npm install
cp .env.example .env.local
npm run dev                # http://localhost:3000
```

### Demo hesapları (yalnızca geliştirme)

| Rol | E-posta | Şifre |
|---|---|---|
| Admin | `admin@burgermash.dev` | `admin12345` |
| Mutfak | `mutfak@burgermash.dev` | `mutfak12345` |

Müşteri hesabını arayüzden kayıt olarak oluşturabilirsiniz. Promosyon kodu: `MASH10` (%10).
> Yayında bu şifreler ortam değişkenleriyle mutlaka değiştirilmelidir ([yayın rehberi](docs/DEPLOYMENT.md)).

## Testler

```bash
# API: birim testleri (fiyatlandırma kuralları)
cd api && npm test

# API: uçtan uca (gerçek veritabanı + WebSocket) — PostgreSQL açık olmalı (npm run db:dev)
cd api && npm run test:e2e

# Tarayıcı e2e (Playwright): kendi API + web sunucularını ayrı portlarda ve taze veritabanıyla başlatır
cd web && npx playwright install chromium   # CI için; Windows'ta yerelde Edge kullanılır
cd web && npm run test:e2e
```

Kapsam: 21 API birim testi, 18 API uçtan uca testi, 20 tarayıcı testi. Sipariş fiyatlandırma kuralları ve reddedilen girdiler, kimlik doğrulama ve rol yetkileri, durum geçişleri, WebSocket ile mutfak/müşteri güncellemeleri, admin değişikliklerinin menüye yansıması; tarayıcıda menü, sipariş akışı, canlı takip, giriş, personel ekranları, dil değiştirme, diyet filtreleri, PWA ve çevrimdışı davranış.

Her push ve pull request'te [GitHub Actions](.github/workflows/ci.yml) lint, tip denetimi, tüm testler ve derlemeyi çalıştırır.

## API özeti

Tam liste: Swagger (`/docs`).

| Yöntem | Yol | Erişim |
|---|---|---|
| `GET` | `/menu` | Herkes |
| `POST` | `/auth/register`, `/auth/login` | Herkes |
| `POST` | `/orders` | Misafir / üye |
| `GET` | `/orders/:id` | Herkes (kişisel veriler gizli) |
| `GET` | `/orders/mine` | Üye |
| `POST` | `/promo/validate` | Herkes |
| `GET` | `/kitchen/orders` | Mutfak, Admin |
| `PATCH` | `/orders/:id/status` | Mutfak, Admin |
| `GET/PATCH` | `/admin/products`, `/admin/options` | Admin |

WebSocket olayları: `order:new` (mutfak), `order:updated` (mutfak ve ilgili müşteri), `track` (müşteri sipariş odasına katılır).

## Klasör yapısı

```
api/   NestJS API (src/auth, src/menu, src/orders, prisma/, test/)
web/   Next.js uygulaması (app/, components/, lib/, e2e/)
docs/  Yayın rehberi
```

## Yayın

Ücretsiz katmanlarla (Vercel + Render + Neon) yayınlama adımları: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Lisans ve kaynaklar

Kod portföy amaçlıdır. Menü fotoğrafları [Unsplash](https://unsplash.com) üzerinden, Unsplash lisansıyla kullanılmıştır.
