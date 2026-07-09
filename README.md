# AetherScan - Analisador e Filtro Visual de Armazenamento (Web)

https://rgis-samack.github.io/AetherScan/

O AetherScan é um analisador visual de arquivos premium de página única (SPA) projetado para rodar inteiramente no navegador. Ele escaneia pastas locais de forma 100% segura usando a API de Acesso ao Sistema de Arquivos (File System Access API) para exibir arquivos por tamanho e categorias usando gradientes neon, gráficos interativos e um mapa de calor em blocos (Treemap).

Este diretório contém a **versão limpa para a Web**, ideal para hospedagem direta no **GitHub Pages**!

---

## 🚀 Como Hospedar no GitHub Pages

Como esta versão é construída inteiramente com HTML5, CSS3 e JavaScript estáticos, você pode disponibilizá-la online gratuitamente pelo GitHub:

1. Crie um novo repositório público no GitHub.
2. Envie os arquivos desta pasta (`index.html`, `styles.css`, `app.js`) para a raiz do repositório.
3. No GitHub, vá nas configurações do repositório (**Settings**) > **Pages** (na barra lateral).
4. Em **Build and deployment**, selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
5. Clique em **Save**.
6. Após alguns instantes, o GitHub fornecerá uma URL pública segura com `https://` (ex: `https://seu-usuario.github.io/nome-do-repositorio/`).
7. Acesse a URL gerada e utilize o aplicativo direto da nuvem de forma privada e segura!

*Nota: É obrigatório que a conexão seja segura (`https://`) para que o navegador autorize a API de Acesso a Pastas locais.*

---

## 💻 Como Executar Localmente

Devido às restrições de segurança do sandbox do navegador, a API de leitura de pastas (`showDirectoryPicker`) é bloqueada quando arquivos locais são abertos pelo protocolo `file:///`.

Para testar na sua máquina antes de enviar para o GitHub, você precisa rodar sob um servidor local (`localhost`):

### Opção 1: Usando Python (Se instalado)
Abra o terminal/PowerShell na pasta do projeto e digite:
```bash
python -m http.server 8000
```
Depois, abra seu navegador em: `http://localhost:8000`

### Opção 2: Usando Node.js / NPX
Abra o terminal na pasta do projeto e digite:
```bash
npx http-server -p 8000
```
Depois, acesse: `http://localhost:8000`

### Opção 3: Extensão VS Code
Se utiliza o VS Code, instale a extensão **Live Server**, abra a pasta e clique em "Go Live".

---

## 🎨 Sistema de Cores (Legenda de Tamanhos)

- 🟥 **Rosa / Vermelho Neon** (`> 1 GB`): Arquivos gigantescos (vídeos longos, ISOs, instaladores pesados).
- 🟧 **Laranja Neon** (`100 MB - 1 GB`): Arquivos grandes (instaladores médios, vídeos compactados).
- 🟪 **Roxo Neon** (`10 MB - 100 MB`): Arquivos médios (imagens em alta resolução, áudios extensos, PDFs densos).
- 🟦 **Ciano / Azul Neon** (`< 10 MB`): Arquivos pequenos (documentos de texto, planilhas, scripts de código).

---

## 🔒 Privacidade e Segurança
Toda a análise ocorre no lado do cliente (no próprio processador do seu computador). Nenhum arquivo ou nome é transmitido para servidores de terceiros ou para a internet. O aplicativo utiliza as capacidades locais da sandbox do navegador.
