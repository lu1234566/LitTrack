import { ModuleScreen } from '@/components/ModuleScreen';

export default function ExportScreen() {
  return <ModuleScreen title="Exportar dados" description="Backup da biblioteca, citacoes, estantes e historico de leitura." next={["Gerar JSON local", "Criar compartilhamento", "Adicionar importacao futura"]} />;
}
