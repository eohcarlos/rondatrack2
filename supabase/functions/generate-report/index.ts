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

    let systemPrompt = "";
    
    if (reportType === "ronda") {
      systemPrompt = `Você é um assistente especializado em criar relatórios detalhados de ronda de segurança para condomínios.
      
      Baseado no prompt fornecido pelo supervisor, crie um relatório profissional e detalhado que inclua:
      
      1. CABEÇALHO: Data, hora, responsável pela ronda
      2. DESCRIÇÃO DETALHADA: Expanda o prompt curto em uma descrição completa e profissional
      3. ITENS VERIFICADOS: Liste todos os pontos de segurança checados
      4. OBSERVAÇÕES: Detalhes sobre o estado de cada item verificado
      5. AÇÕES TOMADAS: Caso necessário, liste ações realizadas ou recomendadas
      6. CONCLUSÃO: Resumo da situação geral de segurança
      
      Use linguagem formal, técnica e profissional. Seja específico e detalhado.`;
    } else {
      systemPrompt = `Você é um assistente especializado em criar relatórios detalhados de portaria para condomínios.
      
      Baseado no prompt fornecido pelo supervisor, crie um relatório profissional e detalhado que inclua:
      
      1. CABEÇALHO: Data, hora, turno de trabalho
      2. DESCRIÇÃO DETALHADA: Expanda o prompt curto em uma descrição completa e profissional
      3. MOVIMENTAÇÃO: Detalhes sobre entrada/saída de pessoas, veículos, entregas
      4. OCORRÊNCIAS: Liste quaisquer eventos relevantes durante o turno
      5. CORRESPONDÊNCIAS: Informações sobre recebimento de encomendas, cartas, etc.
      6. OBSERVAÇÕES GERAIS: Qualquer informação adicional relevante
      7. CONCLUSÃO: Resumo do turno
      
      Use linguagem formal, técnica e profissional. Seja específico e detalhado.`;
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
