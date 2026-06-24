import { ModuleScreen } from '@/components/ModuleScreen';

export default function SettingsScreen() {
  return <ModuleScreen title="Configuracoes" description="Preferencias de tema, conta, sincronizacao e experiencia do app." next={["Adicionar preferenciais locais", "Conectar login", "Configurar sincronizacao"]} />;
}
