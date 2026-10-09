import { createClient } from "@supabase/supabase-js";

// 환경변수 대신 새 Supabase 주소와 Key를 직접 넣어 동작 여부를 확실히 검증합니다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ojvtdaxfycecfrqpupdw.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdnRkYXhmeWNlY2ZycXB1cGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjE1NzEsImV4cCI6MjEwNzA5NzU3MX0.3WgTul0P9dWYv5UdhlgWo2T5tZayrHgSz3IY4VAwbuk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);