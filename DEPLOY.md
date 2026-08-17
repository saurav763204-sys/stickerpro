# StickerPro Cloudflare setup
1. Install Node.js and run: npm install
2. Login: npx wrangler login
3. Create D1: npx wrangler d1 create stickerpro-db
4. Put the returned database_id into wrangler.jsonc
5. Run schema: npx wrangler d1 execute stickerpro-db --remote --file=./schema.sql
6. Add secrets with `npx wrangler secret put RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
7. Add RAZORPAY_KEY_ID as a non-secret Worker variable.
8. Deploy: npx wrangler deploy
9. In Razorpay Dashboard set webhook to https://YOUR-WORKER-DOMAIN/api/payments/webhook and subscribe to payment.captured and payment.failed.
