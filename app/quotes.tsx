import { ModuleScreen } from '@/components/ModuleScreen';

export default function QuotesScreen() {
  return <ModuleScreen title="Citacoes" description="Espaco para registrar, revisar e organizar trechos marcantes das leituras." next={["Criar modelo de citacao", "Associar citacao ao livro", "Adicionar busca e favoritos"]} />;
}
