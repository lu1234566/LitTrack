import { Redirect } from 'expo-router';

// Alvo do deep link (readora:///oauthredirect) que o Google usa para devolver
// o controle ao app depois do consentimento. O resultado do OAuth em si é
// processado pelo expo-auth-session/WebBrowser em segundo plano; esta rota
// existe apenas para o expo-router não cair em "Unmatched Route" — ela manda
// o usuário de volta para a tela de Conta, onde o status do login aparece.
export default function OAuthRedirectScreen() {
  return <Redirect href="/account" />;
}
