import { Book, LiteraryProfile, Recommendation, Quote, BookGenre, ReadingSession } from "../types";

const MOODS = [
  "Sombrio", "Tenso", "Reflexivo", "Aconchegante", "Emocional", "Misterioso", "Caótico", "Inspirador", "Cerebral", "Mágico"
];

export const analysisService = {
  inferMoods(book: Book): string[] {
    const moods = new Set<string>();
    
    // Genre mapping
    const genreMoodMap: Record<string, string[]> = {
      "Mistério": ["Misterioso", "Tenso"],
      "Suspense": ["Tenso", "Sombrio"],
      "Terror": ["Sombrio", "Tenso", "Caótico"],
      "Romance": ["Emocional", "Aconchegante"],
      "Fantasia": ["Mágico", "Inspirador"],
      "Ficção Científica": ["Cerebral", "Reflexivo"],
      "Biografia": ["Inspirador"],
      "História": ["Reflexivo"],
      "Autoajuda": ["Inspirador", "Aconchegante"],
      "Não Ficção": ["Cerebral", "Reflexivo"],
      "Ficção": ["Reflexivo"]
    };

    if (genreMoodMap[book.genero]) {
      genreMoodMap[book.genero].forEach(m => moods.add(m));
    }

    // Keyword inference from notes/review
    const text = (book.resenha + " " + book.pontosFortes + " " + book.pontosFracos).toLowerCase();
    
    const keywordMap: Record<string, string[]> = {
      "sombrio": ["Sombrio"],
      "escuro": ["Sombrio"],
      "tenso": ["Tenso"],
      "ansiedade": ["Tenso"],
      "angústia": ["Tenso", "Emocional"],
      "triste": ["Emocional"],
      "emocionante": ["Emocional"],
      "conforto": ["Aconchegante"],
      "doce": ["Aconchegante"],
      "pensa": ["Reflexivo"],
      "filosófico": ["Reflexivo"],
      "mistério": ["Misterioso"],
      "enigma": ["Misterioso"],
      "caos": ["Caótico"],
      "bagunça": ["Caótico"],
      "mágico": ["Mágico"],
      "encantamento": ["Mágico"],
      "intenso": ["Tenso", "Emocional"]
    };

    Object.entries(keywordMap).forEach(([keyword, mds]) => {
      if (text.includes(keyword)) {
        mds.forEach(m => moods.add(m));
      }
    });

    return Array.from(moods);
  },

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
    
    // 5. Pace & Length Metrics
    const shortestBookInfo = finishedBooks.filter(b => (b.pageCount || 0) > 0).sort((a, b) => (a.pageCount || 0) - (b.pageCount || 0))[0];
    const longestBookInfo = finishedBooks.filter(b => (b.pageCount || 0) > 0).sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0))[0];

    // Calculate avg days to finish
    let totalDays = 0;
    let booksWithDates = 0;
    finishedBooks.forEach(b => {
      if (b.startedAt && b.finishedAt) {
        const diff = (b.finishedAt - b.startedAt) / (1000 * 60 * 60 * 24);
        if (diff > 0) {
          totalDays += diff;
          booksWithDates++;
        }
      }
    });
    const avgDaysToFinish = booksWithDates > 0 ? Math.round(totalDays / booksWithDates) : 0;

    // Calculate pages per month (for active months)
    const monthPages: Record<string, number> = {};
    finishedBooks.forEach(b => {
      const key = `${b.mesLeitura}-${b.anoLeitura}`;
      monthPages[key] = (monthPages[key] || 0) + (b.pageCount || 0);
    });
    const monthsActive = Object.keys(monthPages).length;
    const avgPagesPerMonth = monthsActive > 0 ? Math.round(Object.values(monthPages).reduce((a, b) => a + b, 0) / monthsActive) : 0;

    const lengthInsights: string[] = [];
    if (avgPages < 250) lengthInsights.push("Sua preferência recai sobre leituras curtas e dinâmicas.");
    else if (avgPages > 500) lengthInsights.push("Você não teme a densidade e prefere habitar universos vastos.");
    else lengthInsights.push("Você tende a preferir livros de tamanho médio, entre 250 e 400 páginas.");

    if (avgDaysToFinish > 0 && avgDaysToFinish < 7) lengthInsights.push("Seu ritmo de leitura é voraz, concluindo obras em menos de uma semana.");
    else if (avgDaysToFinish > 21) lengthInsights.push("Você saboreia suas leituras por longos períodos, mergulhando fundo na atmosfera.");

    // 4. Mood Analysis
    const moodCounts: Record<string, number> = {};
    finishedBooks.forEach(b => {
      const bookMoods = b.moods && b.moods.length > 0 ? b.moods : this.inferMoods(b);
      bookMoods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
    });

    const moodMap = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, intensity: (count / finishedBooks.length) * 100 }))
      .sort((a, b) => b.intensity - a.intensity);

    const dominantMood = moodMap[0]?.mood || "Neutro";

    let archetype = {
      name: "O Explorador Silencioso",
      description: "Você lê com curiosidade, buscando novos mundos sem preconceitos de gênero.",
      emotionalResonance: "Curiosidade",
      demandingGenre: "Ficção"
    };

    if (dominantMood === "Sombrio" || dominantMood === "Tenso") {
      archetype = {
        name: "O Estrategista Sombrio",
        description: "Você é atraído pelas sombras e pela tensão, buscando entender os labirintos da mente humana.",
        emotionalResonance: dominantMood,
        demandingGenre: "Suspense / Noir"
      };
    } else if (dominantMood === "Aconchegante") {
      archetype = {
        name: "O Leitor de Atmosferas",
        description: "Sua leitura é um refúgio. Você busca histórias que abraçam e trazem conforto.",
        emotionalResonance: "Calma",
        demandingGenre: "Romance / Slice of Life"
      };
    } else if (dominantMood === "Reflexivo" || dominantMood === "Cerebral") {
      archetype = {
        name: "O Analista Metafísico",
        description: "Ler para você é pensar. Você busca obras que desafiam sua percepção e expandem seu intelecto.",
        emotionalResonance: "Intelecto",
        demandingGenre: "Filosofia / Hard Sci-Fi"
      };
    } else if (avgRating > 4.5) {
      archetype = {
        name: "O Entusiasta Devoto",
        description: "Você encontra beleza e significado em quase tudo o que lê, mergulhando profundamente em cada história.",
        emotionalResonance: "Empatia",
        demandingGenre: favoriteGenre
      };
    }

    return {
      generoFavorito: favoriteGenre,
      tipoNarrativaFavorita: this.inferNarrativeType(favoriteGenre),
      elementoMaisValorizado: dominantMood === "Emocional" ? "Conexão Humana" : (avgRating > 4 ? "Profundidade Emocional" : "Estrutura Narrativa"),
      pontoMaisCritico: avgRating < 3 ? "Originalidade" : "Ritmo",
      autorMaisCompativel: authorMaisCompativel,
      estiloLeitor: avgPages > 400 ? "Leitor de Fôlego" : "Leitor Dinâmico",
      readingPace: {
        avgPagesPerBook: Math.round(avgPages),
        avgDaysToFinish,
        shortestBook: shortestBookInfo ? { title: shortestBookInfo.titulo, pages: shortestBookInfo.pageCount || 0 } : undefined,
        longestBook: longestBookInfo ? { title: longestBookInfo.titulo, pages: longestBookInfo.pageCount || 0 } : undefined,
        preferredRange: avgPages > 500 ? "+500 págs" : avgPages > 250 ? "250-500 págs" : "Até 250 págs",
        avgPagesPerMonth
      },
      insights: [
        `Seu clima literário predominante é ${dominantMood}.`,
        `Você demonstra uma preferência clara por obras de ${favoriteGenre}.`,
        ...lengthInsights,
      ],
      analiseDetalhada: `Sua jornada literária é marcada por uma busca constante por atmosferas ${dominantMood.toLowerCase()}s. Com uma média de ${avgRating.toFixed(1)} estrelas em livros de aproximadamente ${Math.round(avgPages)} páginas, você se consolida como um leitor ${avgRating > 4 ? 'apaixonado' : 'analítico'}.`,
      rankingAutores,
      moodMap,
      readingStyleBehavior: [
        { pattern: "Atmosfera Principal", description: `Foco em leituras de tom ${dominantMood.toLowerCase()}.` },
        { pattern: "Frequência", description: finishedBooks.length > 10 ? "Leitor assíduo com ritmo constante." : "Leitor seletivo que saboreia cada obra." }
      ],
      genreMetrics: Object.entries(genreCounts).map(([genre, count]) => ({
        genre,
        intensity: (count / finishedBooks.length) * 100,
        strictness: 70, // Base value
        averageRating: authorStats[genre]?.avgRating || 0
      })),
      evolutionData: [], 
      evolutionInsights: [
        `Suas leituras recentes inclinam-se para o ${dominantMood}.`,
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

  getMonthlyMood(books: Book[]): string {
    if (books.length === 0) return "Equilibrado";
    const moodCounts: Record<string, number> = {};
    books.forEach(b => {
      const bookMoods = b.moods && b.moods.length > 0 ? b.moods : this.inferMoods(b);
      bookMoods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
    });
    return Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Reflexivo";
  },

  generateMonthlySummary(month: string, books: Book[]): string {
    if (books.length === 0) return "";
    
    const avgRating = books.reduce((acc, b) => acc + b.notaGeral, 0) / books.length;
    const totalPages = books.reduce((acc, b) => acc + (b.pageCount || 0), 0);
    
    const dominantMood = this.getMonthlyMood(books);

    const summaries: string[] = [];
    
    if (dominantMood === "Sombrio" || dominantMood === "Tenso") {
      summaries.push(`${month} foi um mês de imersão em atmosferas densas e intrigantes.`);
    } else if (dominantMood === "Aconchegante") {
      summaries.push(`${month} revelou-se um refúgio acolhedor com leituras reconfortantes.`);
    } else if (dominantMood === "Reflexivo" || dominantMood === "Cerebral") {
      summaries.push(`${month} foi marcado por reflexões profundas e desafios intelectuais.`);
    } else if (dominantMood === "Emocional") {
      summaries.push(`${month} foi um período de grande conexão emocional com as histórias.`);
    } else {
      summaries.push(`${month} trouxe uma diversidade equilibrada de ritmos e tons.`);
    }

    if (avgRating >= 4.5) {
      summaries.push("Um período de excelência literária com obras que superaram expectativas.");
    } else if (books.length >= 4) {
      summaries.push("Um mês de ritmo voraz e muitas descobertas concluídas.");
    } else if (totalPages > 1500) {
      summaries.push("O foco esteve em obras de grande fôlego e profundidade.");
    }

    return summaries.join(" ");
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

  calculateStreak(sessions: ReadingSession[]): number {
    if (sessions.length === 0) return 0;
    
    const dates = new Set(
      sessions.map(s => {
        const d = new Date(s.date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      })
    );
    
    const sortedDates = Array.from(dates).sort((a, b) => b - a);
    const today = new Date();
    const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    let currentStreak = 0;
    let expectedDate = todayAtStart;
    
    // Check if the most recent session was today or yesterday
    const mostRecent = sortedDates[0];
    const oneDay = 1000 * 60 * 60 * 24;
    
    if (mostRecent < todayAtStart - oneDay) {
      return 0; // Streak broken
    }
    
    // If most recent was yesterday, start counting from yesterday
    if (mostRecent === todayAtStart - oneDay) {
      expectedDate = todayAtStart - oneDay;
    }

    for (const date of sortedDates) {
      if (date === expectedDate) {
        currentStreak++;
        expectedDate -= oneDay;
      } else if (date < expectedDate) {
        break;
      }
    }
    
    return currentStreak;
  },

  generateRecommendations(books: Book[]): Recommendation[] {
    const finished = books.filter(b => b.status === "lido" || b.status === "lendo");
    if (finished.length === 0) return [];

    const genreCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    
    finished.forEach(b => {
      genreCounts[b.genero] = (genreCounts[b.genero] || 0) + 1;
      const bookMoods = b.moods && b.moods.length > 0 ? b.moods : this.inferMoods(b);
      bookMoods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
    });

    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Reflexivo";

    // Local "recommendations" are actually just tips based on current data
    return [
      {
        titulo: `Explorar mais de ${topGenre}`,
        autor: "Sugestão Readora",
        genero: topGenre || "Vários",
        motivo: `Com base nas suas leituras de ${topGenre}, sugerimos buscar obras que mantenham este padrão de qualidade.`,
        compatibilidade: 95,
        clima: topMood,
        tipoFinal: "Consistente",
        impactoEmocional: "Estabilidade"
      },
      {
        titulo: `Busca por Atmosfera ${topMood}`,
        autor: "Personalidade Literária",
        genero: "Vários",
        motivo: `Você tem demonstrado grande afinidade com o clima ${topMood.toLowerCase()} recentemente. Busque novos títulos nesta vibe.`,
        compatibilidade: 88,
        clima: topMood,
        tipoFinal: "Envolvente",
        impactoEmocional: "Ressonância"
      },
      {
        titulo: "Desafiar seu Arquétipo",
        autor: "Diversidade Literária",
        genero: "Novo Gênero",
        motivo: "Sair da zona de conforto de vez em quando expande seus horizontes. Tente um clima diferente do habitual.",
        compatibilidade: 70,
        clima: topMood === "Sombrio" ? "Aconchegante" : "Caótico",
        tipoFinal: "Surpreendente",
        impactoEmocional: "Descoberta"
      }
    ];
  }
};
