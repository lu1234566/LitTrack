# Migração Readora para Expo/React Native

Esta branch (`expo-native-migration`) é a oficina isolada para transformar o Readora em aplicativo nativo real com Expo/React Native.

A branch `main` continua preservando o app original React + Vite / Capacitor.

## Estado atual

Implementado até agora:

- base Expo com `expo-router`;
- configuração `app.json`, `eas.json` e TypeScript;
- tema visual dark premium do Readora;
- navegação inferior fixa;
- Dashboard com estatísticas, meta anual e insight do leitor;
- Biblioteca com busca e filtros;
- formulário expandido de livro;
- tela completa de detalhes do livro;
- galeria visual de livros;
- citações derivadas dos livros;
- estantes automáticas;
- perfil literário com arquétipo e gêneros;
- retrospectiva local;
- recomendações simples;
- cápsula mensal;
- exportação em JSON preview com preferências;
- ajustes editáveis com nome do leitor, formato favorito e lembrete;
- tela de metas com meta anual e páginas diárias;
- menu de módulos mais polido;
- persistência local com AsyncStorage;
- helpers iniciais de push/pull Firestore.

## Como rodar no Codespaces

```bash
git pull
npm install
npm run web
```

Para reiniciar limpo:

```bash
npx expo start --clear --web
```

## Como rodar localmente

```bash
npm install
npm run start
```

Para Android:

```bash
npm run android
```

## Como gerar APK pela EAS

```bash
npx eas login
npx eas build:configure
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

## O que ainda falta

1. Login Google nativo.
2. Sincronização Firestore ligada ao usuário autenticado.
3. Capas reais e busca externa de livros.
4. Estantes manuais editáveis.
5. Citações independentes do livro.
6. Ícone e splash final.
7. Teste em aparelho físico.
8. Build AAB de produção.

## Observação importante

Esta branch ainda não deve substituir a `main`. Ela já está funcional, mas continua sendo a área segura da migração nativa.
