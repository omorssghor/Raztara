# RAZTARA AI Director — Safe Foundation (Bangla)

## লক্ষ্য
RAZTARA-কে ধাপে ধাপে AI-সহায়তায় পরিচালিত করা: ব্যবহারকারীর চাহিদা বিশ্লেষণ, বাগ রিপোর্ট, পরীক্ষার ফল, ব্যবসায়িক মেট্রিক এবং প্রয়োজন হলে মালিককে বাংলা নোটিশ। কোনো আয় নিশ্চিত নয়; শুরুতে খরচ শূন্য/সীমিত রাখতে হবে।

## বর্তমান পর্যবেক্ষণ
- বিদ্যমান অ্যাপ: React/Vite, Supabase JS; package-এ Google GenAI SDK-ও আছে।
- Supabase-এ profiles, conversations, messages, call_signals, calls, friendships, blocked_users, wallets এবং tip transaction-সম্পর্কিত টেবিল আছে।
- Supabase Advisor সতর্ক করেছে: কিছু SECURITY DEFINER ফাংশন anon/authenticated role থেকে চালানো যায়; leaked-password protection বন্ধ। এগুলো ফাংশনের উদ্দেশ্য/পলিসি দেখে আলাদাভাবে সমাধান করতে হবে।
- এই শাখা মূল অ্যাপের কার্যকর চ্যাট/কল ফিচার বদলানোর জন্য নয়।

## পর্যায়
1. Read-only audit: repository, RLS, database functions, storage policies, auth settings ও deploy workflow যাচাই।
2. Owner-only AI task/report tables; RLS deny-by-default; সব কাজের audit log।
3. AI connector server-side Edge Function-এ; API key শুধু Supabase secrets-এ। Secret না থাকলে AI endpoint বন্ধ থাকবে, কোনো key client-side-এ রাখা যাবে না।
4. প্রথমে শুধু read-only diagnostics/report; কোনো স্বয়ংক্রিয় deploy, user messaging, spending, wallet credit বা payout নয়।
5. Sandbox branch-এ code changes ও tests; review ও rollback পথ।
6. সীমিত স্বয়ংক্রিয়তা শুধু নিরাপদ পরীক্ষা এবং owner-configured budgets/limits যোগ করার পর।
7. ব্যবসার আয় বাস্তব payment/ad reports দিয়ে হিসাব করতে হবে; projected income-কে earned income বলা যাবে না।

## নিরাপত্তা নীতি
- Never expose Supabase service-role key or AI provider key to browser.
- No arbitrary SQL/code execution from model output.
- No direct money movement, bKash payouts, account deletion, policy weakening, or production deployment without explicit owner approval.
- User messages/private content are not used for analytics unless necessary, disclosed, access-controlled and privacy-respecting.
- Apply rate limits, budget caps, idempotency, audit trails, retries with ceilings, and a kill switch.
- On failure, stop safely and notify the owner in Bangla.
- Never promise revenue or full autonomy without oversight.

## Needed to enable live AI
1. Choose the AI provider and supply its API key only through Supabase Project Settings > Edge Functions > Secrets (never paste it into chat or GitHub).
2. Confirm how the owner account will be identified/authorized for the private dashboard.
3. Confirm free-tier/usage limits and deployment target. No paid services should be enabled automatically.
4. After secrets are added, run a minimal health check with a hard usage cap.
