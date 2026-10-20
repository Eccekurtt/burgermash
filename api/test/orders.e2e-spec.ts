import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';
import { CorsIoAdapter } from '../src/common/cors-io.adapter.js';

const waitFor = <T>(socket: Socket, event: string, ms = 5000) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`"${event}" olayı gelmedi`)), ms);
    socket.once(event, (data: T) => {
      clearTimeout(t);
      resolve(data);
    });
  });

describe('BurgerMash API (e2e)', () => {
  let app: INestApplication;
  let url: string;
  const http = () => request(app.getHttpServer());

  const baseOrder = {
    items: [
      {
        productId: 'bacon',
        mode: 'menu',
        side: 'baharatli',
        drink: 'limonata',
        removed: ['Turşu'],
        extras: ['x-kofte'],
        sauces: ['s-ranch', 's-bbq'],
        qty: 1,
      },
    ],
    customerName: 'Test Müşteri',
    phone: '5550000000',
    fulfillment: 'delivery',
    address: 'Test Mah. 1',
    promo: 'mash10',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new CorsIoAdapter(app, ['http://localhost:3000']));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0);
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('menü', () => {
    it('GET /menu ürünleri, ekstraları, sosları ve menü ayarlarını döner', async () => {
      const { body } = await http().get('/menu').expect(200);
      expect(body.products).toHaveLength(29);
      expect(body.extras.length).toBeGreaterThan(0);
      expect(body.sauces.length).toBeGreaterThan(0);
      expect(body.menu.baseAdd).toBe(70);
      const jalapeno = body.products.find((p: { id: string }) => p.id === 'jalapeno');
      expect(jalapeno).toMatchObject({ calories: 780, dietary: ['spicy'] });
      expect(jalapeno.allergens).toContain('gluten');
      expect(body.menu.sides.map((s: { id: string }) => s.id)).toContain('patates');
    });

    it('GET /health', async () => {
      await http().get('/health').expect(200, { status: 'ok', db: 'up' });
    });
  });

  describe('sipariş', () => {
    it('fiyatı sunucuda hesaplar (menü + ekstra + sos + promosyon)', async () => {
      const { body } = await http().post('/orders').send(baseOrder).expect(201);
      // 259 + 70 (menü) + 10 (baharatlı) + 70 (ekstra köfte) + 20 (soslar) = 429
      expect(body.subtotal).toBe(429);
      expect(body.discount).toBe(43);
      expect(body.total).toBe(386);
      expect(body.status).toBe('RECEIVED');
      expect(body.items[0].name).toBe('Dev Bacon Menü');
    });

    it('özel burgeri doğru fiyatlar', async () => {
      const { body } = await http()
        .post('/orders')
        .send({
          items: [{ custom: { patties: 2, extras: ['cheese', 'lettuce'] }, mode: 'menu', sauces: ['s-ketcap'], qty: 2 }],
          customerName: 'Özel',
          fulfillment: 'pickup',
        })
        .expect(201);
      // 150 + 70 + 40 + 8 + 10 (sos) + 70 (menü) = 348, iki adet
      expect(body.total).toBe(696);
    });

    it('istemciden gelen fiyat alanını reddeder', async () => {
      await http()
        .post('/orders')
        .send({ items: [{ productId: 'bacon', mode: 'tek', qty: 1, price: 1 }], customerName: 'x', fulfillment: 'pickup' })
        .expect(400);
    });

    it('geçersiz içerikleri reddeder', async () => {
      const bad = (items: unknown[], extra: object = {}) =>
        http().post('/orders').send({ items, customerName: 'x', fulfillment: 'pickup', ...extra }).expect(400);
      await bad([{ productId: 'yok', mode: 'tek', qty: 1 }]);
      await bad([{ productId: 'bacon', mode: 'tek', qty: 0 }]);
      await bad([{ productId: 'bacon', mode: 'tek', qty: 1, removed: ['Marul'] }]);
      await bad([], {});
      await bad([{ productId: 'bacon', mode: 'tek', qty: 1 }], { promo: 'SAHTE' });
    });

    it('promosyon kodunu doğrular', async () => {
      await http().post('/promo/validate').send({ code: ' mash10 ' }).expect(201, { code: 'MASH10', rate: 0.1 });
      await http().post('/promo/validate').send({ code: 'SAHTE' }).expect(400);
    });

    it('teslimat için adres zorunlu, gel-al için değil', async () => {
      const items = [{ productId: 'patates', mode: 'tek', qty: 1 }];
      await http().post('/orders').send({ items, customerName: 'x', fulfillment: 'delivery' }).expect(400);
      await http().post('/orders').send({ items, customerName: 'x', fulfillment: 'pickup' }).expect(201);
    });

    it('takip sayfası kişisel bilgileri gizler', async () => {
      const { body: created } = await http().post('/orders').send(baseOrder).expect(201);
      const { body } = await http().get(`/orders/${created.id}`).expect(200);
      expect(body.status).toBe('RECEIVED');
      expect(body).not.toHaveProperty('address');
      expect(body).not.toHaveProperty('phone');
      // ham seçimler var (ön yüz seçilen dilde yeniden oluşturur) ama serbest metin notu yok
      expect(body.items[0].config).toMatchObject({ productId: 'bacon', mode: 'menu' });
      expect(body.items[0].config).not.toHaveProperty('note');
      await http().get('/orders/olmayan-id').expect(404);
    });
  });

  describe('kimlik doğrulama', () => {
    const email = `musteri-${Date.now()}@example.com`;

    it('kayıt, çift kayıt, giriş ve yanlış şifre', async () => {
      const reg = await http().post('/auth/register').send({ email, name: 'Müşteri', password: 'sifre12345' }).expect(201);
      expect(reg.body.accessToken).toBeTruthy();
      expect(reg.body.user.role).toBe('CUSTOMER');
      expect(reg.body.user).not.toHaveProperty('passwordHash');

      await http().post('/auth/register').send({ email, name: 'Müşteri', password: 'sifre12345' }).expect(409);
      await http().post('/auth/login').send({ email, password: 'yanlis-sifre' }).expect(401);
      await http().post('/auth/login').send({ email, password: 'sifre12345' }).expect(201);
      await http().post('/auth/register').send({ email: 'x@y.com', name: 'X', password: 'kisa' }).expect(400);
    });

    it('/auth/me token ister', async () => {
      await http().get('/auth/me').expect(401);
      const { body } = await http().post('/auth/login').send({ email, password: 'sifre12345' });
      const me = await http().get('/auth/me').set('authorization', `Bearer ${body.accessToken}`).expect(200);
      expect(me.body.email).toBe(email);
    });

    it('giriş yapan müşterinin siparişi hesabına bağlanır', async () => {
      const { body: login } = await http().post('/auth/login').send({ email, password: 'sifre12345' });
      const auth = { authorization: `Bearer ${login.accessToken}` };
      await http().post('/orders').set(auth).send(baseOrder).expect(201);
      const { body: mine } = await http().get('/orders/mine').set(auth).expect(200);
      expect(mine).toHaveLength(1);
      expect(mine[0].customerName).toBe('Test Müşteri'); // sahibi tüm bilgiyi görür
      // "tekrar sipariş ver" için ham seçimler saklanır (adet hariç)
      expect(mine[0].items[0].config).toMatchObject({ productId: 'bacon', mode: 'menu', side: 'baharatli' });
      await http().get('/orders/mine').expect(401);
    });
  });

  describe('yetkilendirme', () => {
    it('müşteri mutfak ve admin rotalarına giremez', async () => {
      const { body } = await http()
        .post('/auth/register')
        .send({ email: `m-${Date.now()}@example.com`, name: 'Musteri', password: 'sifre12345' });
      const auth = { authorization: `Bearer ${body.accessToken}` };
      await http().get('/kitchen/orders').expect(401);
      await http().get('/kitchen/orders').set(auth).expect(403);
      await http().get('/admin/products').set(auth).expect(403);
      await http().patch('/admin/products/klasik').set(auth).send({ price: 1 }).expect(403);
    });

    it('mutfak personeli admin rotalarına giremez, admin girer', async () => {
      const kitchen = await http().post('/auth/login').send({ email: 'kitchen@test.dev', password: 'kitchen-pass-123' });
      await http().get('/admin/products').set('authorization', `Bearer ${kitchen.body.accessToken}`).expect(403);

      const admin = await http().post('/auth/login').send({ email: 'admin@test.dev', password: 'admin-pass-123' });
      await http().get('/admin/products').set('authorization', `Bearer ${admin.body.accessToken}`).expect(200);
    });
  });

  describe('mutfak akışı ve gerçek zamanlı güncelleme', () => {
    let kitchenToken: string;
    let kitchenSocket: Socket;
    let customerSocket: Socket;

    beforeAll(async () => {
      const { body } = await http().post('/auth/login').send({ email: 'kitchen@test.dev', password: 'kitchen-pass-123' });
      kitchenToken = body.accessToken;
      kitchenSocket = io(url, { auth: { token: kitchenToken }, transports: ['websocket'] });
      customerSocket = io(url, { transports: ['websocket'] });
      await Promise.all([waitFor(kitchenSocket, 'connect'), waitFor(customerSocket, 'connect')]);
    });

    afterAll(() => {
      kitchenSocket.close();
      customerSocket.close();
    });

    it('yeni sipariş mutfağa anında düşer, durum değişimi müşteriye iletilir', async () => {
      const newOrder = waitFor<{ id: string; address: string }>(kitchenSocket, 'order:new');
      const { body: created } = await http().post('/orders').send(baseOrder).expect(201);
      const pushed = await newOrder;
      expect(pushed.id).toBe(created.id);
      expect(pushed.address).toBe('Test Mah. 1'); // mutfak adresi görür

      // müşteri kendi siparişini dinler
      const ack = await customerSocket.emitWithAck('track', { orderId: created.id });
      expect(ack).toEqual({ ok: true, status: 'RECEIVED' });

      const customerUpdate = waitFor<Record<string, unknown>>(customerSocket, 'order:updated');
      const kitchenUpdate = waitFor<Record<string, unknown>>(kitchenSocket, 'order:updated');
      const kitchenAuth = { authorization: `Bearer ${kitchenToken}` };

      await http().patch(`/orders/${created.id}/status`).set(kitchenAuth).send({ status: 'PREPARING' }).expect(200);

      const [forCustomer, forKitchen] = await Promise.all([customerUpdate, kitchenUpdate]);
      expect(forCustomer.status).toBe('PREPARING');
      expect(forCustomer).not.toHaveProperty('address'); // müşteri kanalında kişisel veri yok
      expect(forKitchen.status).toBe('PREPARING');
      expect(forKitchen.address).toBe('Test Mah. 1');
    });

    it('durum geçişleri sıraya uyar', async () => {
      const { body: created } = await http().post('/orders').send(baseOrder).expect(201);
      const auth = { authorization: `Bearer ${kitchenToken}` };
      const patch = (status: string) => http().patch(`/orders/${created.id}/status`).set(auth).send({ status });

      await patch('DELIVERED').expect(400); // RECEIVED -> DELIVERED yasak
      await patch('PREPARING').expect(200);
      await patch('RECEIVED').expect(400); // geri dönülmez
      await patch('ON_THE_WAY').expect(200);
      await patch('DELIVERED').expect(200);
      await patch('CANCELLED').expect(400); // teslim edilen iptal edilemez

      const { body } = await http().get(`/orders/${created.id}`).expect(200);
      expect(body.status).toBe('DELIVERED');
    });

    it('mutfak panosu aktif siparişleri, geçmiş teslim edilenleri listeler', async () => {
      const auth = { authorization: `Bearer ${kitchenToken}` };
      const { body: active } = await http().get('/kitchen/orders').set(auth).expect(200);
      expect(active.every((o: { status: string }) => ['RECEIVED', 'PREPARING', 'ON_THE_WAY'].includes(o.status))).toBe(true);
      const { body: history } = await http().get('/kitchen/orders?history=true').set(auth).expect(200);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('admin menü yönetimi', () => {
    it('fiyat ve stok değişikliği menüye yansır', async () => {
      const admin = await http().post('/auth/login').send({ email: 'admin@test.dev', password: 'admin-pass-123' });
      const auth = { authorization: `Bearer ${admin.body.accessToken}` };

      await http().patch('/admin/products/churros').set(auth).send({ available: false, price: 99 }).expect(200);
      const { body: menu } = await http().get('/menu').expect(200);
      expect(menu.products.find((p: { id: string }) => p.id === 'churros')).toBeUndefined();

      // tükenen ürün sipariş edilemez
      await http()
        .post('/orders')
        .send({ items: [{ productId: 'churros', mode: 'tek', qty: 1 }], customerName: 'x', fulfillment: 'pickup' })
        .expect(400);

      await http().patch('/admin/products/churros').set(auth).send({ available: true, price: 89 }).expect(200);
      await http().patch('/admin/products/yok').set(auth).send({ price: 1 }).expect(404);
      await http().patch('/admin/products/churros').set(auth).send({ price: -5 }).expect(400);
    });
  });
});
