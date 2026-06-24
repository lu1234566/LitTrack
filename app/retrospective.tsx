import { ModuleScreen } from '@/components/ModuleScreen';

export default function RetrospectiveScreen() {
  return <ModuleScreen title="Retrospectiva" description="Resumo anual de leituras, paginas, notas, generos e momentos marcantes." next={["Agrupar dados por ano", "Criar cards de conquistas", "Gerar resumo anual compartilhavel"]} />;
}
