# Reactive Resume - Proje Dokümantasyonu

Bu belge, **Reactive Resume** projesinin kapsamlı bir teknik dokümantasyonunu sunmaktadır. Reactive Resume, kullanıcıların özgeçmiş oluşturma, güncelleme ve paylaşma süreçlerini basitleştiren ücretsiz ve açık kaynaklı bir platformdur.

---

## 1. Genel Bakış

Reactive Resume, gizliliği ön planda tutan (privacy-first), kullanıcıların verileri üzerinde tam kontrol sahibi olduğu, modern web teknolojileri ile geliştirilmiş bir özgeçmiş oluşturucudur. 

**Temel Özellikler:**
- Eşzamanlı (Real-time) önizleme.
- Çoklu dışa aktarma formatları (PDF, JSON, DOCX).
- Sürükle ve bırak ile bölüm sıralama.
- Özel ve profesyonel temalar (Pokemon isimleriyle adlandırılmış).
- AI (Yapay Zeka) entegrasyonu (OpenAI, Google Gemini, Anthropic Claude vb.).
- JSON Resume formatı içe aktarma.
- Passkey ve İki Faktörlü Doğrulama (2FA) desteği.
- Çoklu dil ve RTL desteği.

---

## 2. Teknoloji Yığını (Tech Stack)

Proje bir **Turborepo** (pnpm) monorepo mimarisi üzerine kuruludur.

| Kategori | Teknoloji |
| --- | --- |
| **Framework** | TanStack Start (React 19, Vite) |
| **Sunucu / Runtime** | Node.js (v24), Hono |
| **Dil** | TypeScript |
| **Veritabanı** | PostgreSQL, Drizzle ORM |
| **API İletişimi** | oRPC (Type-safe RPC), OpenAPI, MCP (Model Context Protocol) |
| **Kimlik Doğrulama** | Better Auth (OAuth2, Passkey, 2FA) |
| **Stil / Tasarım** | Tailwind CSS v4, Base UI + shadcn-style bileşenler |
| **Durum Yönetimi** | Zustand, TanStack Query |
| **Depolama** | S3 uyumlu depolama (Örn. SeaweedFS) veya Yerel Dosya Sistemi |
| **Önbellek & AI State**| Redis |
| **PDF Oluşturma** | `@react-pdf/renderer` (Tamamen istemci tarafı) |

---

## 3. Mimari ve Dizin Yapısı

Proje, tek bir Node.js süreci olarak dağıtılırken kaynak kod tam yığın (full-stack) web uygulaması, bir sunucu adaptörü ve odaklanmış dâhili paketler olarak bölünmüştür.

### 3.1. Uygulamalar (`apps/`)

- **`apps/web`**: TanStack Start uygulaması. Yönlendirmeler (routes), web özellik alanları (features), tarayıcı PDF.js önizleme kodu ve PWA (Progressive Web App) ayarları burada bulunur. 
- **`apps/server`**: Hono kullanan üretim sunucusu. HTTP adaptörleri, oRPC işlemleri, MCP taşıma katmanı, OpenAPI işleyicileri ve statik dosya sunumu burada yer alır.

### 3.2. Paketler (`packages/`)

Dâhili paketler, diğer çalışma alanları tarafından `package.json` üzerinden dışa aktarımlarıyla kullanılır. Özel `src` dosyalarına doğrudan içe aktarma yapılmaz.

- **`@reactive-resume/api`**: oRPC yönlendiricileri ve özellik tabanlı iş mantığı.
- **`@reactive-resume/auth`**: Better Auth yapılandırması ve yetkilendirme tipleri.
- **`@reactive-resume/db`**: Drizzle istemcisi ve veritabanı şemaları.
- **`@reactive-resume/schema`**: Zod şemaları ve özgeçmiş (resume) veri modelleri.
- **`@reactive-resume/pdf`**: React PDF doküman yapıları, temalar ve tarayıcı/sunucu adaptörleri.
- **`@reactive-resume/docx`**: DOCX formatında dışa aktarma araçları.
- **`@reactive-resume/mcp`**: MCP (Model Context Protocol) araçları ve sistem istemleri.
- **`@reactive-resume/ui`**: Paylaşılan Base UI / shadcn stili React bileşenleri.
- **`@reactive-resume/resume`**: Salt özgeçmiş verisi araçları (örneğin JSON Patch işleme).
- **`@reactive-resume/ai`**, **`import`**, **`fonts`**, **`email`**, **`env`**, **`utils`**, **`config`**: Spesifik destek işlevleri sunan paketler.

---

## 4. Veritabanı Şeması

Veritabanı, PostgreSQL üzerinde **Drizzle ORM** kullanılarak yönetilmektedir. Şema 3 ana gruba ayrılır (toplam 20 tablo):

### 4.1. Kimlik Doğrulama (Auth - 12 Tablo)
Better Auth ile tam bir yetkilendirme ve OAuth2 sunucu implementasyonu.
- `user`, `session`, `account`, `verification`, `two_factor`, `passkey`, `apikey`, `jwks`, `oauth_client`, `oauth_refresh_token`, `oauth_access_token`, `oauth_consent`

### 4.2. Özgeçmiş (Resume - 3 Tablo)
- **`resume`**: Temel tablo. Kullanıcının CV verileri `jsonb` formatında `data` kolonunda tutulur.
- **`resume_statistics`**: (1:1 ilişki) Görüntülenme ve indirilme sayıları.
- **`resume_analysis`**: (1:1 ilişki) Yapay zeka destekli özgeçmiş analizi.

### 4.3. Yapay Zeka Ajanı (Agent - 5 Tablo)
- **`ai_providers`**: Kullanıcıların API anahtarları (şifrelenmiş).
- **`agent_threads`**, **`agent_messages`**, **`agent_attachments`**, **`agent_actions`**: AI asistan ile yapılan konuşmalar, sohbet geçmişi ve özgeçmişe uygulanan (ve geri alınabilen) değişiklik (JSON Patch) kayıtları.

---

## 5. API ve Servisler (Rotasyon Yapısı)

Sistem üç farklı iletişim katmanı destekler:
1. **oRPC (binary)**: Uygulama içi (istemci - sunucu) tip güvenli iletişim.
2. **OpenAPI (REST)**: Geleneksel HTTP istekleri ve dokümantasyon.
3. **MCP (Streamable HTTP)**: Model Context Protocol iletişimi.

**Ana API Alanları (`packages/api/src/features/*`):**
- **`ai` & `aiProviders`**: PDF/DOCX ayrıştırma, yapay zeka sohbetleri ve analizi.
- **`agent`**: İş parçacıkları (threads), mesajlaşma ve geriye dönük işlemler (revert).
- **`auth`**: Better Auth tabanlı yetkilendirme.
- **`resume`**: CRUD işlemleri, JSON Patch uygulaması, şifreli paylaşım ve kopyalama.
- **`statistics`**: Platform istatistikleri.
- **`storage`**: Dosya yükleme ve silme işlemleri.

---

## 6. Tasarım ve Kullanıcı Arayüzü (Design System)

Proje, içeriğin (kullanıcının özgeçmişinin) ön planda olduğu, renksiz (monochrome) ve "dark-mode" (karanlık mod) varsayılanlı bir tasarım diline sahiptir.

- **Renk Paleti**: Saf gri tonları (OKLch tabanlı). Tek renkli (chromatic) istisna, tehlikeli işlemler için kullanılan "Destructive Red" rengidir.
- **Tipografi**: Uygulama arayüzünde tek bir yazı tipi (**IBM Plex Sans Variable**) kullanılır. Ancak özgeçmiş içeriklerinde Google Fonts'tan 1000'den fazla yazı tipi seçilebilir.
- **Düzen**: Özgeçmiş oluşturucu (Builder), masaüstünde üç panelli bir çalışma alanı sunar (Sol: Formlar, Orta: Canlı PDF önizleme, Sağ: Tasarım ve Düzenleme paneli).
- **Yerelleştirme (i18n)**: 40'tan fazla dil desteği ve RTL (Sağdan Sola) diller için tam destek. Mantıksal CSS özellikleri (örn. `ps-2` yerine fiziksel margin kullanılmaz) yoğun şekilde kullanılır.
- **Animasyonlar**: Motion kütüphanesi ile hızlı, akıcı ve yavaşlatılmış etkileşimler (`prefers-reduced-motion` destekli).

---

## 7. Geliştirme Ortamı (Development Setup)

### Gereksinimler
- Node.js (v24)
- pnpm (v11.1.2) - Corepack ile
- Docker ve Docker Compose

### Kurulum Adımları
1. **Depoyu Klonlayın**:
   ```bash
   git clone https://github.com/amruthpillai/reactive-resume.git
   cd reactive-resume
   ```
2. **Bağımlılıkları Yükleyin**:
   ```bash
   corepack enable
   pnpm install
   ```
3. **Altyapı Servislerini Başlatın** (PostgreSQL, Redis, SeaweedFS):
   ```bash
   docker compose -f compose.dev.yml up -d postgres redis seaweedfs seaweedfs_create_bucket
   ```
4. **Çevresel Değişkenleri Ayarlayın**: `.env.example` dosyasını `.env.local` (veya `.env`) olarak kopyalayıp yapılandırın.
5. **Veritabanı Taşıma (Migration) İşlemleri**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" pnpm run db:migrate
   ```
6. **Geliştirme Sunucusunu Başlatın**:
   ```bash
   pnpm run dev
   ```
   *Uygulama `http://localhost:3000` adresinden erişilebilir olacaktır.*

### Sık Kullanılan Komutlar
- `pnpm run db:studio`: Drizzle Studio (Veritabanı GUI) başlatır.
- `pnpm exec turbo boundaries`: Çalışma alanı (workspace) sınır kurallarını test eder.
- `pnpm check`: Biome ile lint ve kod formatlama (write modu).
