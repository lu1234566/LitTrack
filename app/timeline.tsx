import { ModuleScreen } from '@/components/ModuleScreen';

export default function TimelineScreen() {
  return <ModuleScreen title="Timeline" description="Historico cronologico das leituras, alteracoes de status e sessoes." next={["Criar eventos de leitura", "Ordenar por data", "Adicionar filtros por ano"]} />;
}
