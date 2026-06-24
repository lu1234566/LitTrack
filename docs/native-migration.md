# Migração Readora para Expo/React Native

Esta branch (`expo-native-migration`) é uma área isolada para transformar o Readora em aplicativo nativo real com Expo/React Native.

A branch `main` continua preservando o app original React + Vite.

## Estado da migração

Implementado nesta primeira etapa:

- base Expo com `expo-router`;
- configuração `app.json`;
- perfis `eas.json`;
- TypeScript configurado para Expo;
- tema visual dark premium do Readora;
- Dashboard nativo;
- Biblioteca nativa;
- tela de adicionar livro;
- tela de detalhes e progresso;
- persistência local com AsyncStorage;
- serviço inicial para Firebase nativo.

## Como rodar localmente

```bash
npm install
npm run start
```

Para Android:

```bash
npm run android
```

Para limpar cache:

```bash
npx expo start --clear
```

## Como gerar APK pela EAS

Primeiro configure o projeto Expo/EAS:

```bash
npx eas login
npx eas build:configure
```

Depois gere APK de preview:

```bash
npm run build:android:preview
```

O perfil `preview` em `eas.json` está configurado como APK interno.

## Variáveis de ambiente

Copie `.env.native.example` para `.env` e preencha:

```txt
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

## Próximas etapas

1. Migrar autenticação Google para fluxo nativo.
2. Substituir armazenamento local por Firestore.
3. Migrar campos completos do modelo antigo de livros.
4. Migrar citações.
5. Migrar estantes.
6. Migrar perfil literário.
7. Migrar recomendações.
8. Criar ícone e splash final.
9. Testar APK em aparelho físico.
10. Preparar build de produção AAB.

## Observação importante

Esta branch ainda não deve substituir a `main`. Ela é um protótipo nativo funcional para iniciar a transição com segurança.
