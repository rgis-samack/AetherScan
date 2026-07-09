# AetherScan - Analisador e Filtro Visual de Armazenamento (Web)

https://rgis-samack.github.io/AetherScan/

O AetherScan é um analisador visual de arquivos premium de página única (SPA) projetado para rodar inteiramente no navegador. Ele escaneia pastas locais de forma 100% segura usando a API de Acesso ao Sistema de Arquivos (File System Access API) para exibir arquivos por tamanho e categorias usando gradientes neon, gráficos interativos e um mapa de calor em blocos (Treemap).


## 🎨 Sistema de Cores (Legenda de Tamanhos)

- 🟥 **Rosa / Vermelho Neon** (`> 1 GB`): Arquivos gigantescos (vídeos longos, ISOs, instaladores pesados).
- 🟧 **Laranja Neon** (`100 MB - 1 GB`): Arquivos grandes (instaladores médios, vídeos compactados).
- 🟪 **Roxo Neon** (`10 MB - 100 MB`): Arquivos médios (imagens em alta resolução, áudios extensos, PDFs densos).
- 🟦 **Ciano / Azul Neon** (`< 10 MB`): Arquivos pequenos (documentos de texto, planilhas, scripts de código).

---

## 🔒 Privacidade e Segurança
Toda a análise ocorre no lado do cliente (no próprio processador do seu computador). Nenhum arquivo ou nome é transmitido para servidores de terceiros ou para a internet. O aplicativo utiliza as capacidades locais da sandbox do navegador.
