import { ModuleScreen } from '@/components/ModuleScreen';

export default function SearchScreen() {
  return <ModuleScreen title="Pesquisar livros" description="Busca de livros e importacao de metadados para a biblioteca." next={["Conectar API de busca", "Preencher formulario automaticamente", "Salvar resultados no Firestore"]} />;
}
