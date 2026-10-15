# Lux Salus — site institucional

Landing page responsiva da Lux Salus, feita com HTML, CSS e JavaScript puro. Não precisa instalar dependências nem usar um framework.

## Como abrir

1. Extraia a pasta `lux-salus-site` do ZIP.
2. Abra `index.html` no navegador.
3. Para editar, abra `index.html`, `styles.css` e `script.js` em um editor como VS Code.

Para uma prévia mais fiel do funcionamento local, também é possível iniciar um servidor simples na pasta do projeto:

```bash
python -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

## O que já está incluído

- Layout responsivo para desktop, tablet e celular.
- Seções de estética, cabelo & barba, fisioterapia e bem-estar.
- Seção de história, espaço, depoimento, barbearia e contato.
- Menu móvel, links de agendamento, animações suaves de entrada e folhas desfocadas animadas nas bordas.
- Respeito à preferência do sistema por movimento reduzido.
- Imagens locais na pasta `assets`, sem dependências externas.

## Personalização

- **Imagens:** substitua os arquivos `.webp` dentro de `assets`, mantendo os mesmos nomes, ou ajuste seus caminhos em `index.html`.
- **Agendamento:** o site usa o link de WhatsApp identificado no perfil de referência. Para trocar, pesquise por `wa.me/message/HLZ4FXUXRSKCH1` em `index.html` e substitua todas as ocorrências.
- **Instagram:** altere o link `instagram.com/luxsalus.estetica` caso o endereço oficial seja outro.
- **Textos e endereço:** edite diretamente os textos no `index.html`.
- **Cores, espaçamento e animações:** ajuste as variáveis no início de `styles.css`.

As fotos das seções internas são recortes de referência para compor a primeira versão visual e podem ser substituídas pelas fotografias originais em alta resolução da clínica.
