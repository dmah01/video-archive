import { createClient } from "@supabase/supabase-js";

// 환경변수 대신 새 Supabase 주소와 Key를 직접 넣어 동작 여부를 확실히 검증합니다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ehcbnoqkuiklbrpfbfhn.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY2Jub3FrdWlrbGJycGZiZmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0OTkyMjAsImV4cCI6MjEwNzA3NTIyMH0.1TFucNU2jDMlRKjRnm72Ze4ma3-0OBlJtTNha1dX3aU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);