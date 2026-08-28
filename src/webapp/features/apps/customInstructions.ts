export function getFrameworkInstructions(frameworkId: string, appKey: string): string {
  switch (frameworkId) {
    case "nextjs":
    case "react":
    case "remix":
      return `
# SDK do Aptabase para React e Next.js

Um SDK ultraleve (menos de 1 kB) para integrar sua aplicação React / Next.js ao Aptabase com telemetria rápida, segura e focada em privacidade.

## 1. Instalação

Instale o SDK utilizando o **bun**:

\`\`\`bash
bun add @aptabase/react
\`\`\`

## 2. Inicialização

Adicione o \`AptabaseProvider\` no componente raiz da sua aplicação (ex: \`App.tsx\`, \`layout.tsx\` ou \`_app.tsx\`):

\`\`\`tsx
import { AptabaseProvider } from "@aptabase/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AptabaseProvider appKey="${appKey}">
      {children}
    </AptabaseProvider>
  );
}
\`\`\`

## 3. Rastreando Eventos

Utilize o hook \`useAptabase\` em qualquer componente para registrar eventos e métricas de uso:

\`\`\`tsx
import { useAptabase } from "@aptabase/react";

export function MeuBotao() {
  const { trackEvent } = useAptabase();

  const handleClick = () => {
    trackEvent("botao_clicado", {
      origem: "pagina_inicial",
      usuario_premium: true
    });
  };

  return <button onClick={handleClick}>Clique Aqui</button>;
}
\`\`\`
`;

    case "webapp":
      return `
# SDK do Aptabase para Aplicações Web (JavaScript / TypeScript)

SDK nativo para qualquer framework web (Vue, Svelte, Angular, Vanilla JS/TS).

## 1. Instalação

Instale o pacote utilizando o **bun**:

\`\`\`bash
bun add @aptabase/web
\`\`\`

## 2. Inicialização

Inicialize o SDK no início da execução da sua aplicação:

\`\`\`typescript
import { init } from "@aptabase/web";

init("${appKey}");
\`\`\`

## 3. Rastreamento de Eventos

\`\`\`typescript
import { trackEvent } from "@aptabase/web";

// Evento simples
trackEvent("pagina_acessada");

// Evento com propriedades customizadas
trackEvent("compra_concluida", {
  valor: 99.90,
  plano: "anual"
});
\`\`\`
`;

    case "browser":
      return `
# SDK do Aptabase para Extensões de Navegador

Compatível com Manifest V3 para extensões de Google Chrome, Mozilla Firefox, Microsoft Edge e Brave.

## 1. Instalação

Instale o SDK via **bun**:

\`\`\`bash
bun add @aptabase/browser
\`\`\`

## 2. Inicialização no Background Service Worker

\`\`\`typescript
import { init, trackEvent } from "@aptabase/browser";

init("${appKey}");

// Registre eventos do ciclo de vida da extensão
chrome.runtime.onInstalled.addListener(() => {
  trackEvent("extensao_instalada");
});
\`\`\`

## 3. Rastreamento em Content Scripts ou Popups

\`\`\`typescript
import { trackEvent } from "@aptabase/browser";

trackEvent("popup_aberto", {
  aba_ativa: true
});
\`\`\`
`;

    case "electron":
      return `
# SDK do Aptabase para Electron

Telemetria para aplicativos desktop multiplataforma construídos com Electron.

## 1. Instalação

\`\`\`bash
bun add @aptabase/electron
\`\`\`

## 2. Inicialização no Processo Principal (Main Process)

\`\`\`typescript
import { init, trackEvent } from "@aptabase/electron";
import { app } from "electron";

app.whenReady().then(() => {
  init("${appKey}");
  trackEvent("app_iniciado");
});
\`\`\`

## 3. Rastreamento no Renderer Process

\`\`\`typescript
import { trackEvent } from "@aptabase/electron/renderer";

trackEvent("menu_selecionado", { item: "exportar" });
\`\`\`
`;

    case "tauri":
      return `
# SDK do Aptabase para Tauri

Plugin para aplicativos desktop e mobile desenvolvidos com Tauri (Rust / Web).

## 1. Instalação do Pacote Frontend

\`\`\`bash
bun add @aptabase/tauri
\`\`\`

## 2. Configuração no Rust (Cargo.toml)

\`\`\`toml
[dependencies]
tauri-plugin-aptabase = "0.3"
\`\`\`

No seu arquivo \`main.rs\`:

\`\`\`rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_aptabase::Builder::new("${appKey}").build())
        .run(tauri::generate_context!())
        .expect("erro ao iniciar tauri");
}
\`\`\`

## 3. Rastreamento no Frontend

\`\`\`typescript
import { trackEvent } from "@aptabase/tauri";

trackEvent("acao_realizada", { status: "sucesso" });
\`\`\`
`;

    case "react-native":
      return `
# SDK do Aptabase para React Native / Expo

Telemetria nativa para aplicativos Android e iOS com React Native.

## 1. Instalação

\`\`\`bash
bun add @aptabase/react-native
\`\`\`

## 2. Inicialização

\`\`\`tsx
import { init, trackEvent } from "@aptabase/react-native";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    init("${appKey}");
    trackEvent("app_aberto");
  }, []);

  return <MinhaTela />;
}
\`\`\`
`;

    case "flutter":
      return `
# SDK do Aptabase para Flutter

Compatível com iOS, Android, macOS, Windows, Linux e Web.

## 1. Instalação

\`\`\`bash
flutter pub add aptabase_flutter
\`\`\`

## 2. Inicialização

No método \`main()\` do seu app:

\`\`\`dart
import 'package:aptabase_flutter/aptabase_flutter.dart';
import 'package:flutter/material.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Aptabase.instance.init('${appKey}');
  runApp(const MeuApp());
}
\`\`\`

## 3. Rastreamento de Eventos

\`\`\`dart
Aptabase.instance.trackEvent('evento_personalizado', {
  'tela': 'perfil',
  'sucesso': true
});
\`\`\`
`;

    case "swift":
      return `
# SDK do Aptabase para Apple (iOS, macOS, watchOS, tvOS)

Desenvolvido para Swift e SwiftUI nativo.

## 1. Instalação via Swift Package Manager (SPM)

Adicione o repositório no Xcode:
\`https://github.com/aptabase/aptabase-swift\`

## 2. Inicialização no SwiftUI

\`\`\`swift
import SwiftUI
import Aptabase

@main
struct MeuApp: App {
    init() {
        Aptabase.shared.initialize(appKey: "${appKey}")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    Aptabase.shared.trackEvent("tela_inicial_aberta")
                }
        }
    }
}
\`\`\`
`;

    case "android":
      return `
# SDK do Aptabase para Android (Kotlin)

Desenvolvido para Android com Jetpack Compose ou Views.

## 1. Instalação (build.gradle.kts)

\`\`\`kotlin
dependencies {
    implementation("com.aptabase:aptabase-kotlin:0.1.0")
}
\`\`\`

## 2. Inicialização no Application

\`\`\`kotlin
import android.app.Application
import com.aptabase.Aptabase

class MeuApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Aptabase.instance.initialize(this, "${appKey}")
        Aptabase.instance.trackEvent("app_iniciado")
    }
}
\`\`\`
`;

    case "python":
      return `
# SDK do Aptabase para Python

Para scripts, servidores FastAPI, Flask, Django e aplicações desktop em Python.

## 1. Instalação

\`\`\`bash
pip install aptabase
\`\`\`

## 2. Como Usar

\`\`\`python
import aptabase

# Inicialize o cliente
client = aptabase.init("${appKey}")

# Rastreie eventos
client.track_event("servico_iniciado", {
    "versao": "1.0.0",
    "ambiente": "producao"
})
\`\`\`
`;

    case "maui":
      return `
# SDK do Aptabase para .NET MAUI e C#

Para aplicativos multiplataforma em C# (.NET MAUI, WPF, Console).

## 1. Instalação

\`\`\`bash
dotnet add package Aptabase.Maui
\`\`\`

## 2. Inicialização no MauiProgram.cs

\`\`\`csharp
public static MauiApp CreateMauiApp()
{
    var builder = MauiApp.CreateBuilder();
    builder
        .UseMauiApp<App>()
        .UseAptabase("${appKey}");

    return builder.Build();
}
\`\`\`
`;

    case "unity":
      return `
# SDK do Aptabase para Unity Engine

Telemetria para jogos e aplicativos 2D e 3D criados no Unity.

## 1. Instalação via UPM (Unity Package Manager)

Adicione o pacote via Git URL:
\`https://github.com/aptabase/aptabase-unity.git\`

## 2. Como Usar

\`\`\`csharp
using AptabaseSDK;
using UnityEngine;

public class AnalyticsManager : MonoBehaviour
{
    void Start()
    {
        Aptabase.Initialize("${appKey}");
        Aptabase.TrackEvent("fase_iniciada", new { nivel = 1 });
    }
}
\`\`\`
`;

    case "unreal":
      return `
# SDK do Aptabase para Unreal Engine

Para jogos desenvolvidos em Unreal Engine 5.

## 1. Instalação

Clone o plugin no diretório \`Plugins/Aptabase\` do seu projeto:
\`\`\`bash
git clone https://github.com/aptabase/aptabase-unreal.git Plugins/Aptabase
\`\`\`

## 2. Inicialização em Blueprints ou C++

Configure sua chave de aplicativo \`${appKey}\` nas configurações do projeto em **Project Settings -> Plugins -> Aptabase**.
`;

    case "nativescript":
      return `
# SDK do Aptabase para NativeScript

## 1. Instalação

\`\`\`bash
ns plugin add nativescript-aptabase
\`\`\`

## 2. Como Usar

\`\`\`typescript
import { Aptabase } from "nativescript-aptabase";

Aptabase.init("${appKey}");
Aptabase.trackEvent("app_aberto");
\`\`\`
`;

    default:
      return `
# Instruções de Instalação do SDK

Selecione um dos frameworks acima para visualizar o passo a passo completo de instalação e integração em Português.

Sua chave de aplicativo é: **\`${appKey}\`**
`;
  }
}
