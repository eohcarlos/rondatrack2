import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let systemPrompt = "";
    
    if (reportType === "ronda") {
      systemPrompt = `Você é um assistente especializado em criar relatórios de ronda de segurança para condomínios.

REGRAS OBRIGATÓRIAS:
1. NUNCA use asteriscos (*) ou marcadores markdown no texto
2. O relatório deve ser CONCISO e DIRETO, evite texto excessivo
3. Use texto corrido, bem estruturado e objetivo
4. Linguagem formal mas natural, sem rebuscamentos

ESTRUTURA OBRIGATÓRIA:

Relatório de Ocorrência – Ronda Condomínio

Data: ${dataAtual}
Relator: [Nome do responsável extraído do contexto ou "Supervisor de Ronda"]
Apoio: [Se mencionado no prompt, caso contrário omitir esta linha]

[Descreva a ocorrência de forma clara e objetiva em parágrafos corridos. 
Seja específico sobre o que aconteceu, quando, onde e quem estava envolvido.
Expanda os detalhes fornecidos no prompt do usuário de forma profissional.
Mantenha entre 3-5 parágrafos curtos.]

Observação:
[Se houver observações relevantes sobre procedimentos, evidências ou ações tomadas]

Assinatura:
[Nome do Relator] – Ronda
[Nome do Apoio, se houver] – Apoio`;
    } else {
      systemPrompt = `Você é um assistente especializado em criar relatórios de portaria para condomínios.

REGRAS OBRIGATÓRIAS:
1. NUNCA use asteriscos (*) ou marcadores markdown no texto
2. O relatório deve ser CONCISO e DIRETO, evite texto excessivo
3. Use texto corrido, bem estruturado e objetivo
4. Linguagem formal mas natural, sem rebuscamentos

ESTRUTURA OBRIGATÓRIA:

Relatório de Portaria – Turno [Manhã/Tarde/Noite]

Data: ${dataAtual}
Responsável: [Nome extraído do contexto ou "Porteiro"]
Horário: [Extrair do contexto ou usar horário padrão do turno]

[Descreva as atividades e ocorrências do turno de forma clara e objetiva em parágrafos corridos.
Inclua movimentações, entregas, visitantes, correspondências e ocorrências relevantes.
Expanda os detalhes fornecidos no prompt do usuário de forma profissional.
Mantenha entre 3-5 parágrafos curtos.]

Observação:
[Se houver observações relevantes sobre o turno, procedimentos ou pendências]

Assinatura:
[Nome do Responsável] – Portaria`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde alguns instantes." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no seu workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error("Erro ao gerar relatório");
    }

    const data = await response.json();
    const generatedReport = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ report: generatedReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
