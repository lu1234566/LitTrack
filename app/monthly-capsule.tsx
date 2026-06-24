import { ModuleScreen } from '@/components/ModuleScreen';

export default function MonthlyCapsuleScreen() {
  return <ModuleScreen title="Capsula mensal" description="Resumo mensal de leituras, humor, ritmo e destaques pessoais." next={["Agrupar leituras por mes", "Gerar resumo visual", "Adicionar compartilhamento"]} />;
}
