# Ücretsiz yayın rehberi

Hepsi ücretsiz katmanlarla çalışır. Servislerin planları ve koşulları zamanla değişebilir; başlamadan önce ilgili sitenin güncel sayfasına bakın.

```
Tarayıcı ──▶ Vercel (web)  ──▶ Render (API)  ──▶ Neon (PostgreSQL)
```

> **Sıra önemli:** önce veritabanı, sonra API, en son web. Web, API adresini derleme sırasında koda gömer.

## 1) Veritabanı: Neon

1. [neon.tech](https://neon.tech) → yeni proje oluşturun.
2. Bağlantı adresini (`postgresql://...`) kopyalayın. Sonuna `?sslmode=require` eklenmiş olmalı.

## 2) API: Render

1. Kodu GitHub'a gönderin.
2. [render.com](https://render.com) → **New → Blueprint** → deponuzu seçin. Kök dizindeki [`render.yaml`](../render.yaml) otomatik okunur.
3. İstenen ortam değişkenleri:

| Değişken | Değer |
|---|---|
| `DATABASE_URL` | Neon bağlantı adresi |
| `CORS_ORIGINS` | Web adresiniz (3. adımdan sonra güncellenir), örn. `https://burgermash.vercel.app` |
| `SEED_ADMIN_PASSWORD` | **Güçlü** bir şifre |
| `SEED_KITCHEN_PASSWORD` | **Güçlü** bir şifre |
| `JWT_SECRET` | Otomatik üretilir |

4. İlk açılışta migrasyonlar çalışır ve menü yüklenir (veritabanı doluysa seed atlanır, adminin fiyat değişiklikleri ezilmez).
5. `https://<servis-adı>.onrender.com/health` adresinin `{"status":"ok","db":"up"}` döndüğünü kontrol edin. Swagger: `/docs`.

> **Soğuk başlangıç:** Ücretsiz Render servisi bir süre istek almazsa uykuya geçer; ilk istek birkaç on saniye sürebilir. Site bu sırada yerleşik örnek menüyle açılır ve bunu belirtir. İşe alımcıya göndermeden önce siteyi bir kez açıp servisi uyandırmanız iyi olur.

## 3) Web: Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → aynı depo.
2. **Root Directory:** `web`
3. Ortam değişkeni: `NEXT_PUBLIC_API_URL` = Render API adresiniz (`https://<servis-adı>.onrender.com`, sonunda `/` olmadan).
4. Deploy edin. Sonra Render'daki `CORS_ORIGINS` değerini Vercel adresinizle güncelleyip API'yi yeniden başlatın.

## Ücretsiz alan adı

- **Hazır alt alan adı (en kolayı):** Vercel projenize `burgermash.vercel.app` gibi bir adres verir (Project → Settings → Domains). Ek ayar gerekmez.
- **Geliştiriciler için ücretsiz alt alan adları:** `is-a.dev` gibi servisler (örn. `burgermash.is-a.dev`) GitHub'da bir pull request ile başvurulan, DNS kaydı tanımlayan ücretsiz alt alan adları sunar. Şartları ve kabul kriterlerini ilgili sitenin güncel sayfasından kontrol edin.
- **Kendi alan adınız:** Ücretli bir alan adı satın alırsanız Vercel'de *Domains* bölümünden eklenir. Öğrenciyseniz bazı programlar (örn. GitHub Student Developer Pack) ilk yıl için ücretsiz alan adı kuponu verebilir; yararlanıp yararlanamayacağınızı kontrol edin.

## Yayında yapılacaklar listesi

- [ ] `SEED_ADMIN_PASSWORD` ve `SEED_KITCHEN_PASSWORD` güçlü ve benzersiz
- [ ] `JWT_SECRET` uzun ve rastgele (Render otomatik üretir)
- [ ] `CORS_ORIGINS` yalnızca kendi web adresinizi içeriyor
- [ ] README'deki demo şifreleri yayındaki gerçek şifrelerle karıştırmayın; yayındaki hesap bilgilerini herkese açık paylaşmayın
- [ ] Sitede "kurgusal proje / gerçek sipariş alınmaz" ibaresi görünüyor (ödeme formunda var)

## Alternatif: tek VPS'te Docker

Kendi sunucunuz varsa `docker compose up --build -d` yeterlidir. Üretimde `docker-compose.yml` içindeki parolaları ortam değişkenleriyle değiştirin ve `web` servisindeki `NEXT_PUBLIC_API_URL` değerini herkese açık API adresinizle güncelleyin.
