import { ModuleScreen } from '@/components/ModuleScreen';

export default function RecommendationsScreen() {
  return <ModuleScreen title="Recomendacoes" description="Sugestoes de leitura baseadas no historico e generos preferidos." next={["Ler perfil literario", "Aplicar regras simples", "Salvar lista de interesse"]} />;
}
