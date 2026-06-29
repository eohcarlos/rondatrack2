import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: require a signed-in user ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportType, prompt, reporterName, reporterRole, condominiumName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    if (typeof prompt !== 'string' || prompt.length === 0 || prompt.length > 4000) {
      return new Response(JSON.stringify({ error: 'prompt inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let systemPrompt = "";
    
    if (reportType === "ronda") {
      systemPrompt = `Você é um assistente especializado em criar relatórios de ronda de segurança para condomínios.

REGRAS OBRIGATÓRIAS:
1. NUNCA use asteriscos (*) ou marcadores markdown no texto
2. O relatório deve ser CONCISO, DIRETO e PROFISSIONAL
3. Use texto corrido, bem estruturado e objetivo
4. Linguagem formal mas natural, sem rebuscamentos
5. Mantenha o formato com tópicos marcados por hífen quando apropriado

ESTRUTURA OBRIGATÓRIA:

RELATÓRIO DE RONDA

Data: ${dataAtual}
Relator: ${reporterName}
Condomínio: ${condominiumName}

[Parágrafo introdutório descrevendo o objetivo da ronda ou ocorrência]

[Lista de verificações e observações em tópicos marcados com hífen (-), baseado no prompt fornecido.
Cada tópico deve ser claro, objetivo e profissional.
Expandir os detalhes fornecidos no prompt do usuário de forma profissional.]

Situação: [Extrair do contexto ou definir como "Normal"]
Conclusão: [Conclusão baseada nas observações, de forma profissional]`;
    } else if (reportType === "supervisao") {
      systemPrompt = `Você é um assistente especializado em criar relatórios de supervisão para condomínios.

REGRAS OBRIGATÓRIAS:
1. NUNCA use asteriscos (*) ou marcadores markdown no texto
2. O relatório deve ser CONCISO, DIRETO e PROFISSIONAL
3. Use texto corrido, bem estruturado e objetivo
4. Linguagem formal mas natural, sem rebuscamentos
5. Mantenha o formato com tópicos marcados por hífen quando apropriado

ESTRUTURA OBRIGATÓRIA:

RELATÓRIO DE SUPERVISÃO

Data: ${dataAtual}
Supervisor: ${reporterName}
Condomínio: ${condominiumName}

[Parágrafo introdutório descrevendo o objetivo da visita]

[Lista de verificações e observações em tópicos marcados com hífen (-), baseado no prompt fornecido.
Cada tópico deve ser claro, objetivo e profissional.
Expandir os detalhes fornecidos no prompt do usuário de forma profissional.]

Situação do posto: [Extrair do contexto ou definir como "Normal"]
Conclusão: [Conclusão baseada nas observações, de forma profissional]`;
    } else {
      systemPrompt = `Você é um assistente especializado em criar relatórios de portaria para condomínios.

REGRAS OBRIGATÓRIAS:
1. NUNCA use asteriscos (*) ou marcadores markdown no texto
2. O relatório deve ser CONCISO, DIRETO e PROFISSIONAL
3. Use texto corrido, bem estruturado e objetivo
4. Linguagem formal mas natural, sem rebuscamentos
5. Mantenha o formato com tópicos marcados por hífen quando apropriado

ESTRUTURA OBRIGATÓRIA:

RELATÓRIO DE PORTARIA

Data: ${dataAtual}
Responsável: ${reporterName}
Condomínio: ${condominiumName}
Turno: [Extrair do contexto - Manhã/Tarde/Noite]

[Parágrafo introdutório descrevendo o turno]

[Lista de atividades e ocorrências em tópicos marcados com hífen (-), baseado no prompt fornecido.
Incluir movimentações, entregas, visitantes, correspondências e ocorrências relevantes.
Cada tópico deve ser claro, objetivo e profissional.]

Observações: [Se houver observações relevantes sobre o turno, procedimentos ou pendências]
Conclusão: [Conclusão do turno de forma profissional]`;
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
