import { GoogleGenAI, Type } from "@google/genai";
import { Book, LiteraryProfile, Recommendation } from "../types";

const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});
};

export const aiService = {
  async generateLiteraryProfile(books: Book[]): Promise<LiteraryProfile> {
    const ai = getAiInstance();
    // Limit to 40 books for better historical context if available
    const recentBooks = [...books].sort((a, b) => (b.finishedAt || b.dataCadastro) - (a.finishedAt || a.dataCadastro)).slice(0, 40);
    const booksData = recentBooks.map(b => ({
      titulo: b.titulo,
      autor: b.autor,
      genero: b.genero,
      nota: b.notaGeral,
      detalhes: b.notasDetalhadas,
      resenha: b.resenha,
      pontosFortes: b.pontosFortes,
      pontosFracos: b.pontosFracos,
      favorito: b.favorito,
      paginas: b.pageCount,
      data: b.finishedAt ? new Date(b.finishedAt).toLocaleDateString('pt-BR') : new Date(b.dataCadastro).toLocaleDateString('pt-BR')
    }));

    const prompt = `Analise o histórico de leitura deste usuário e gere um perfil literário profundo e inteligente, incluindo a EVOLUÇÃO do gosto ao longo do tempo.
    Dados dos livros: ${JSON.stringify(booksData)}
    
    O perfil deve ser escrito em Português (Brasil) com um tom perspicaz, elegante e literário.
    Além do básico, identifique:
    1. Mapa de Mood: Classifique a intensidade emocional/atmosférica predominante.
    2. Comportamento de Leitura: Identifique padrões comportamentais.
    3. Métricas de Gênero: Para os gêneros principais, avalie intensidade e rigor.
    4. Arquétipo do Leitor: Crie um nome de arquétipo poético.
    5. Evolução do Gosto: Como os gêneros, as notas e a complexidade dos livros mudaram nos últimos períodos (meses ou anos).
    6. Insights Intepretativos de Evolução: Frases elegantes sobre como o usuário mudou (ex: "Sua paleta literária expandiu-se para o realismo fantástico").
    7. Preferência de Extensão: Livros curtos, médios, longos ou variados.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generoFavorito: { type: Type.STRING },
            tipoNarrativaFavorita: { type: Type.STRING },
            elementoMaisValorizado: { type: Type.STRING },
            pontoMaisCritico: { type: Type.STRING },
            autorMaisCompativel: { type: Type.STRING },
            estiloLeitor: { type: Type.STRING },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            analiseDetalhada: { type: Type.STRING },
            rankingAutores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  autor: { type: Type.STRING },
                  motivo: { type: Type.STRING }
                },
                required: ["autor", "motivo"]
              }
            },
            moodMap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mood: { type: Type.STRING },
                  intensity: { type: Type.NUMBER }
                },
                required: ["mood", "intensity"]
              }
            },
            readingStyleBehavior: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pattern: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["pattern", "description"]
              }
            },
            genreMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  genre: { type: Type.STRING },
                  intensity: { type: Type.NUMBER },
                  strictness: { type: Type.NUMBER },
                  averageRating: { type: Type.NUMBER }
                },
                required: ["genre", "intensity", "strictness", "averageRating"]
              }
            },
            evolutionData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  period: { type: Type.STRING },
                  topGenre: { type: Type.STRING },
                  averageRating: { type: Type.NUMBER },
                  booksCount: { type: Type.NUMBER },
                  pagesRead: { type: Type.NUMBER },
                  averageBookLength: { type: Type.NUMBER }
                },
                required: ["period", "topGenre", "averageRating", "booksCount", "pagesRead", "averageBookLength"]
              }
            },
            evolutionInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            archetype: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                emotionalResonance: { type: Type.STRING },
                demandingGenre: { type: Type.STRING }
              },
              required: ["name", "description", "emotionalResonance", "demandingGenre"]
            },
            preferredLength: { 
              type: Type.STRING,
              enum: ["short", "medium", "long", "varied"]
            }
          },
          required: [
            "generoFavorito", 
            "tipoNarrativaFavorita", 
            "elementoMaisValorizado", 
            "pontoMaisCritico", 
            "autorMaisCompativel", 
            "estiloLeitor", 
            "insights", 
            "analiseDetalhada",
            "rankingAutores",
            "moodMap",
            "readingStyleBehavior",
            "genreMetrics",
            "evolutionData",
            "evolutionInsights",
            "archetype",
            "preferredLength"
          ]
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      ...result,
      dataAtualizacao: Date.now()
    };
  },

  async generateRecommendations(books: Book[]): Promise<Recommendation[]> {
    const ai = getAiInstance();
    // Limit to 30 most recent books
    const recentBooks = [...books].sort((a, b) => b.dataCadastro - a.dataCadastro).slice(0, 30);
    const booksData = recentBooks.map(b => ({
      titulo: b.titulo,
      autor: b.autor,
      genero: b.genero,
      nota: b.notaGeral,
      favorito: b.favorito,
      resenha: b.resenha
    }));

    const prompt = `Com base no histórico de leitura do usuário: ${JSON.stringify(booksData)}, recomende 6 livros que ele provavelmente adoraria.
    As recomendações devem ser justificadas com base no que ele já leu e gostou.
    Seja específico sobre o clima da leitura, o tipo de final e o impacto emocional esperado.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              titulo: { type: Type.STRING },
              autor: { type: Type.STRING },
              genero: { type: Type.STRING },
              motivo: { type: Type.STRING },
              compatibilidade: { type: Type.NUMBER },
              clima: { type: Type.STRING },
              tipoFinal: { type: Type.STRING },
              impactoEmocional: { type: Type.STRING }
            },
            required: ["titulo", "autor", "genero", "motivo", "compatibilidade", "clima", "tipoFinal", "impactoEmocional"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async generateRetrospectiveNarrative(books: Book[]): Promise<string[]> {
    const ai = getAiInstance();
    // Limit to 30 most recent books
    const recentBooks = [...books].sort((a, b) => b.dataCadastro - a.dataCadastro).slice(0, 30);
    const booksData = recentBooks.map(b => ({
      titulo: b.titulo,
      genero: b.genero,
      nota: b.notaGeral,
      favorito: b.favorito
    }));

    const prompt = `Gere 3 frases curtas e impactantes (estilo Spotify Wrapped) que resumam o ano literário deste usuário com base nestes livros: ${JSON.stringify(booksData)}.
    Exemplo: "Seu ano foi dominado por suspense e tensão psicológica."
    Use um tom emocional e literário.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async generateYearComparisonInsights(yearAData: any, yearBData: any): Promise<string[]> {
    const ai = getAiInstance();
    
    const prompt = `Analise a comparação entre dois anos literários de um leitor e gere 3 insights elegantes e profundos que descrevam a evolução do comportamento de leitura.
    
    Ano A (${yearAData.year}): ${JSON.stringify(yearAData.metrics)}
    Ano B (${yearBData.year}): ${JSON.stringify(yearBData.metrics)}
    
    Considere mudanças em:
    - Volume vs Qualidade (Notas)
    - Preferências de gênero
    - Consistência (Sessões/Dias ativos)
    - Complexidade dos livros
    
    Gere 3 frases curtas e impactantes em Português (Brasil). 
    Exemplos: 
    - "Você leu mais, mas foi mais exigente este ano."
    - "Seu ritmo de leitura cresceu 18% em relação ao ano anterior."
    - "Seu gosto ficou mais focado em suspense."`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  }
};
