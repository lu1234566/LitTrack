import { ModuleScreen } from '@/components/ModuleScreen';

export default function GalleryScreen() {
  return <ModuleScreen title="Galeria" description="Visualizacao das leituras em formato de capas, cards e colecoes." next={["Renderizar capas dos livros", "Criar grade responsiva", "Adicionar filtros por status"]} />;
}
