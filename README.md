# Cloudflare Worker gọi Google Translate trực tiếp

Worker này dùng JavaScript `fetch()` gọi endpoint không chính thức:

```text
https://translate.googleapis.com/translate_a/single
```

Không cần `py-googletrans`, Render hoặc Google Cloud API key.

## Deploy

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Tùy chọn bảo vệ API bằng key riêng:

```bash
npx wrangler secret put API_KEY
```

Nếu không tạo `API_KEY`, API vẫn mở công khai.

## Test GET

```bash
curl -H "X-API-Key: YOUR_KEY" \
  "https://YOUR_WORKER.workers.dev/translate?text=Hello%20world&src=en&dest=vi"
```

Nếu không đặt API_KEY thì bỏ header `-H`.

## Test POST

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"text":"Hello world","src":"en","dest":"vi"}' \
  "https://YOUR_WORKER.workers.dev/translate"
```

## Lưu ý

Đây là endpoint web không chính thức, có thể trả HTTP 429 hoặc bị Google thay đổi/chặn. Cloudflare Worker không bảo đảm loại bỏ được giới hạn đó.
