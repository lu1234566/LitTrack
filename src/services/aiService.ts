import { GoogleGenAI, Type } from "@google/genai";
import { Book, LiteraryProfile, Recommendation } from "../types";

const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});
};

export const aiService = {
  async generateLiteraryProfile(books: Book[]): Promise<LiteraryProfile> {
    const ai = getAiInstance();
    // Limit to 30 most recent books to avoid payload size limits
    const recentBooks = [...books].sort((a, b) => b.dataCadastro - a.dataCadastro).slice(0, 30);
    const booksData = recentBooks.map(b => ({
      titulo: b.titulo,
      autor: b.autor,
      genero: b.genero,
      nota: b.notaGeral,
      detalhes: b.notasDetalhadas,
      resenha: b.resenha,
      pontosFortes: b.pontosFortes,
      pontosFracos: b.pontosFracos,
      favorito: b.favorito
    }));

    const prompt = `Analise o histórico de leitura deste usuário e gere um perfil literário inteligente.
    Dados dos livros: ${JSON.stringify(booksData)}
    
    O perfil deve ser escrito em Português (Brasil) com um tom perspicaz, elegante e literário.
    Infira padrões de gosto, o que o usuário valoriza em uma história, o que o faz tirar pontos e qual seu estilo de leitor.
    Crie também um ranking detalhado dos top 3 autores do usuário, considerando não apenas a frequência de leitura, mas principalmente a consistência de notas altas e o impacto emocional.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
            "rankingAutores"
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
      model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
