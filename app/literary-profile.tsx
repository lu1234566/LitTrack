import { ModuleScreen } from '@/components/ModuleScreen';

export default function LiteraryProfileScreen() {
  return <ModuleScreen title="Perfil literario" description="Leitura dos padroes, generos, ritmos e identidade literaria do usuario." next={["Calcular generos favoritos", "Criar arquetipo leitor", "Migrar graficos da versao web"]} />;
}
