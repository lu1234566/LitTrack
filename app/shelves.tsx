import { ModuleScreen } from '@/components/ModuleScreen';

export default function ShelvesScreen() {
  return <ModuleScreen title="Estantes" description="Colecoes personalizadas para organizar leituras por tema, fase ou objetivo." next={["Criar colecoes locais", "Adicionar livros as estantes", "Sincronizar com Firestore"]} />;
}
