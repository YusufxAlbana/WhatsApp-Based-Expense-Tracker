// deno-lint-ignore-file
// @ts-nocheck — Deno types are resolved at runtime on Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GOOGLE_SHEETS_URL = Deno.env.get("GOOGLE_SHEETS_URL")!;

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const userMessage = payload.message || ""; 
    const userId = payload.sender || "Unknown";

    // 1. Tanya ke Groq untuk Parsing Data
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Model cepat dan hemat limit
        messages: [
          {
            role: "system",
            content: "Ekstrak data pengeluaran dari teks user. Balas HANYA dengan JSON format: {\"item\": string, \"amount\": number, \"category\": string}. Kategori harus salah satu dari: Makanan, Transportasi, Tagihan, Hiburan, Kebutuhan."
          },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" }
      })
    });

    const groqData = await groqResponse.json();
    const content = JSON.parse(groqData.choices[0].message.content);

    // 2. Kirim Hasilnya ke Google Sheets
    if (content.amount > 0) {
      await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          item: content.item,
          amount: content.amount,
          category: content.category
        }),
      });

      return new Response(JSON.stringify({ status: "success", data: content }), { 
        headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ status: "no_data_found" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
})
