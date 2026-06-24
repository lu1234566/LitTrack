import { ModuleScreen } from '@/components/ModuleScreen';

export default function YearlyComparisonScreen() {
  return <ModuleScreen title="Comparativo anual" description="Comparacao entre anos de leitura para medir evolucao e mudancas de perfil." next={["Conectar dados anuais reais", "Comparar paginas lidas", "Exibir tendencias por genero"]} />;
}
