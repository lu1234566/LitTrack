# Build Android com Capacitor

Este projeto é um app React + Vite. Para gerar um APK sem reescrever tudo em Expo/React Native, usamos Capacitor para empacotar a pasta `dist/` dentro de um projeto Android.

## 1. Instalação

```bash
npm install
```

> Importante: o `package-lock.json` pode ser atualizado localmente depois desse comando, porque o projeto recebeu dependências novas do Capacitor.

## 2. Variáveis do Firebase

Crie um arquivo `.env` com as chaves do Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_ID=
```

## 3. Testar web antes do APK

```bash
npm run dev
```

Depois teste:

- login Google;
- criação de livro;
- listagem de livros;
- citações;
- exportação;
- dashboard.

## 4. Gerar a pasta Android

Na primeira vez:

```bash
npm run build
npm run android:add
npm run android:sync
```

Depois das próximas alterações:

```bash
npm run android:sync
```

## 5. Abrir no Android Studio

```bash
npm run android:open
```

No Android Studio:

1. aguarde o Gradle sincronizar;
2. selecione `app`;
3. rode em um emulador ou celular;
4. para gerar APK debug, use **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Também existe o script:

```bash
npm run android:apk
```

Ele tenta gerar um APK debug em:

```txt
android/app/build/outputs/apk/debug/
```

## 6. Firebase Auth no Android/WebView

O app usa Firebase Web Auth. No navegador comum, ele tenta `signInWithPopup`. Quando detecta ambiente de WebView/Capacitor, ele tenta `signInWithRedirect`.

Se o login Google falhar no APK, verifique:

1. Firebase Console > Authentication > Sign-in method > Google ativado;
2. Firebase Console > Authentication > Settings > Authorized domains;
3. se a versão web hospedada em HTTPS faz login corretamente;
4. se o WebView está bloqueando o fluxo Google.

Se o fluxo WebView continuar instável, o próximo passo técnico recomendado é trocar o login por uma solução nativa de Capacitor/Firebase Auth.

## 7. Sobre Expo

O repositório pode continuar linkado ao Expo para organização e automação futura, mas este projeto não é Expo/React Native no momento. Ele é React + Vite. Por isso, o caminho atual para Android é Capacitor.

Para usar EAS Build diretamente, seria necessário converter a interface para Expo/React Native ou criar um wrapper Expo nativo separado.
