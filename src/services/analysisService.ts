import { Book, LiteraryProfile, Recommendation, Quote } from "../types";

export const analysisService = {
  analyzeLiteraryProfile(books: Book[]): LiteraryProfile {
    const finishedBooks = books.filter(b => b.status === "lido");
    
    // 1. Favorite Genre
    const genreCounts: Record<string, number> = {};
    finishedBooks.forEach(b => {
      genreCounts[b.genero] = (genreCounts[b.genero] || 0) + 1;
    });
    const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Explorador";

    // 2. Compatible Authors
    const authorStats: Record<string, { count: number; avgRating: number }> = {};
    finishedBooks.forEach(b => {
      if (!authorStats[b.autor]) authorStats[b.autor] = { count: 0, avgRating: 0 };
      authorStats[b.autor].count += 1;
      authorStats[b.autor].avgRating += b.notaGeral;
    });
    
    const rankingAutores = Object.entries(authorStats)
      .map(([autor, stats]) => ({
        autor,
        score: (stats.count * 2) + (stats.avgRating / stats.count),
        avgRating: stats.avgRating / stats.count
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(a => ({
        autor: a.autor,
        motivo: `Sua consistência com ${a.autor} (${a.avgRating.toFixed(1)} estrelas) indica uma forte sintonia intelectual.`
      }));

    const authorMaisCompativel = rankingAutores[0]?.autor || "Múltiplos Autores";

    // 3. Reading Style & Archetype
    const avgRating = finishedBooks.reduce((acc, b) => acc + b.notaGeral, 0) / (finishedBooks.length || 1);
    const avgPages = finishedBooks.reduce((acc, b) => acc + (b.pageCount || 0), 0) / (finishedBooks.length || 1);
    
    let archetype = {
      name: "O Explorador Silencioso",
      description: "Você lê com curiosidade, buscando novos mundos sem preconceitos de gênero.",
      emotionalResonance: "Curiosidade",
      demandingGenre: "Ficção"
    };

    if (avgRating > 4.5) {
      archetype = {
        name: "O Entusiasta Devoto",
        description: "Você encontra beleza e significado em quase tudo o que lê, mergulhando profundamente em cada história.",
        emotionalResonance: "Empatia",
        demandingGenre: favoriteGenre
      };
    } else if (avgRating < 3.5) {
      archetype = {
        name: "O Crítico Austero",
        description: "Seu padrão de qualidade é altíssimo. Poucas obras conseguem transpor suas defesas literárias.",
        emotionalResonance: "Rigor",
        demandingGenre: "Crítica"
      };
    } else if (avgPages > 500) {
      archetype = {
        name: "O Maratonista de Épicos",
        description: "Você não teme a densidade. Prefere habitar universos vastos e complexos por longos períodos.",
        emotionalResonance: "Resiliência",
        demandingGenre: "Alta Fantasia / Histórico"
      };
    }

    // 4. Mood Map (Simulated based on genres)
    const moodMap = Object.entries(genreCounts).map(([genre, count]) => {
      const mood = this.mapGenreToMood(genre);
      return { mood, intensity: (count / finishedBooks.length) * 100 };
    });

    return {
      generoFavorito: favoriteGenre,
      tipoNarrativaFavorita: this.inferNarrativeType(favoriteGenre),
      elementoMaisValorizado: avgRating > 4 ? "Profundidade Emocional" : "Estrutura Narrativa",
      pontoMaisCritico: avgRating < 3 ? "Originalidade" : "Ritmo",
      autorMaisCompativel: authorMaisCompativel,
      estiloLeitor: avgPages > 400 ? "Leitor de Fôlego" : "Leitor Dinâmico",
      insights: [
        `Você demonstra uma preferência clara por obras de ${favoriteGenre}.`,
        avgRating > 4.2 ? "Seu critério de seleção é excelente, resultando em altas avaliações." : "Você é um leitor experimental, disposto a dar chances a obras diversas.",
        `Sua média de páginas (${Math.round(avgPages)}) sugere que você prefere livros de tamanho ${avgPages > 400 ? 'longo' : 'médio'}.`
      ],
      analiseDetalhada: `Sua jornada literária é marcada por uma busca constante por ${favoriteGenre}. Com uma média de ${avgRating.toFixed(1)} estrelas, você se consolida como um leitor ${avgRating > 4 ? 'apaixonado' : 'analítico'}.`,
      rankingAutores,
      moodMap,
      readingStyleBehavior: [
        { pattern: "Frequência", description: finishedBooks.length > 10 ? "Leitor assíduo com ritmo constante." : "Leitor seletivo que saboreia cada obra." },
        { pattern: "Preferência de Tamanho", description: `Foco em livros de aproximadamente ${Math.round(avgPages)} páginas.` }
      ],
      genreMetrics: Object.entries(genreCounts).map(([genre, count]) => ({
        genre,
        intensity: (count / finishedBooks.length) * 100,
        strictness: 70, // Base value
        averageRating: authorStats[genre]?.avgRating || 0
      })),
      evolutionData: [], // Would require historical grouping logic
      evolutionInsights: [
        "Sua paleta literária tem se mantido fiel aos seus temas fundamentais.",
        "Há uma consistência notável em suas escolhas de autores nos últimos meses."
      ],
      archetype,
      preferredLength: avgPages > 450 ? "long" : avgPages > 200 ? "medium" : "short",
      dataAtualizacao: Date.now()
    };
  },

  mapGenreToMood(genre: string): string {
    const map: Record<string, string> = {
      "Ficção Científica": "Cerebral",
      "Fantasia": "Mágico",
      "Mistério": "Tenso",
      "Suspense": "Tenso",
      "Romance": "Sentimental",
      "História": "Reflexivo",
      "Biografia": "Inspirador",
      "Terror": "Sombrio",
      "Filosofia": "Existencial"
    };
    return map[genre] || "Curioso";
  },

  inferNarrativeType(genre: string): string {
    const map: Record<string, string> = {
      "Mistério": "Investigativa",
      "Romance": "Centrada em Personagens",
      "Fantasia": "World-building denso",
      "Ficção Científica": "Especulativa"
    };
    return map[genre] || "Linear e Envolvente";
  },

  generateRetrospectiveNarrative(books: Book[]): string[] {
    const finished = books.filter(b => b.status === 'lido');
    if (finished.length === 0) return ["Seu ano literário ainda está sendo escrito."];

    const genreCounts: Record<string, number> = {};
    finished.forEach(b => genreCounts[b.genero] = (genreCounts[b.genero] || 0) + 1);
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    const avgRating = finished.reduce((acc, b) => acc + b.notaGeral, 0) / finished.length;
    
    const narratives = [
      `Seu ano foi dominado por ${topGenre || 'diversas histórias'} e descobertas marcantes.`,
      avgRating > 4 
        ? "Você leu com o coração e encontrou obras que realmente ressoaram com sua alma." 
        : "Você foi um crítico atento, buscando a excelência em cada página virada.",
      `Com ${finished.length} livros concluídos, sua jornada foi rica e cheia de personalidade.`
    ];

    return narratives;
  },

  generateYearComparisonInsights(yearAData: any, yearBData: any): string[] {
    const insights: string[] = [];
    
    if (yearBData.metrics.totalLidos > yearAData.metrics.totalLidos) {
      insights.push(`Seu volume de leitura cresceu em relação ao ano anterior.`);
    } else {
      insights.push(`Você focou mais na qualidade e seleção do que no volume bruto.`);
    }

    if (yearBData.metrics.mediaGeral > yearAData.metrics.mediaGeral) {
      insights.push("Você encontrou livros mais satisfatórios ou tornou-se mais generoso em suas notas.");
    } else {
      insights.push("Seu critério de avaliação ficou mais rigoroso este ano.");
    }

    insights.push("Sua jornada revela um amadurecimento constante nas suas escolhas literárias.");
    
    return insights;
  },

  generateRecommendations(books: Book[]): Recommendation[] {
    const finished = books.filter(b => b.status === "lido" || b.status === "lendo");
    if (finished.length === 0) return [];

    const genreCounts: Record<string, number> = {};
    finished.forEach(b => genreCounts[b.genero] = (genreCounts[b.genero] || 0) + 1);
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Local "recommendations" are actually just tips based on current data
    return [
      {
        titulo: `Explorar mais de ${topGenre}`,
        autor: "Sugestão Readora",
        genero: topGenre || "Vários",
        motivo: "Você tem demonstrado grande afinidade com este gênero recentemente.",
        compatibilidade: 95,
        clima: "Váriado",
        tipoFinal: "Consistente",
        impactoEmocional: "Estabilidade"
      },
      {
        titulo: "Desafiar seu Arquétipo",
        autor: "Diversidade Literária",
        genero: "Novo Gênero",
        motivo: "Sair da zona de conforto de vez em quando expande seus horizontes.",
        compatibilidade: 70,
        clima: "Experimental",
        tipoFinal: "Surpreendente",
        impactoEmocional: "Descoberta"
      }
    ];
  }
};
