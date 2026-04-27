## Ajustar cruz dourada para o lugar do "t" em "unicristo"

Na vinheta atual a cruz aparece **antes** da palavra (`[cruz] unicristo`). A referência mostra que ela deve substituir o **"t" inicial** — ou seja, a leitura permanece "unicristo" mas o "t" é renderizado como uma cruz minimalista que fica dourada ao final da animação.

### Mudança

Em `src/components/Splash.tsx`:

1. **Manter a estrutura atual** (cruz inline + letras), apenas reposicioná-la entre `unicris` e `o` para ocupar exatamente o lugar do "t":
   ```
   [u][n][i][c][r][i][s][cruz][o]
   ```
   - Texto antes da cruz: `unicris`
   - Cruz inline (mantém `letter-spacing: 8px` natural do wrapper)
   - Texto depois da cruz: `o`

2. **Ajustes na geometria da cruz** para casar com a altura visual das letras (38px, weight 200) da segunda referência:
   - `width: 14px`, `height: 38px` (mesma altura da fonte)
   - `vertical-align: middle` + `transform: translateY(-3px)` para alinhar a base com a baseline das letras
   - Travessa horizontal a `top: 28%` (mais próxima do topo, como na referência)
   - `margin: 0 8px` para preservar o ritmo do `letter-spacing: 8px` em ambos os lados

3. **Animação preservada**: a cruz continua branca durante a revelação pela linha luminosa e transita para dourado `#D4AF37` aos 2.0s (`uc_turnGold`). Subtítulo "TORNANDO JESUS MAIS CONHECIDO" inalterado.

Nenhum outro arquivo precisa ser tocado. App.tsx, Login.tsx, index.html e a fonte Montserrat permanecem como estão.

### Arquivo alterado

- `src/components/Splash.tsx` — reposicionar `<span class="uc-cross" />` entre "unicris" e "o" e ajustar dimensões/alinhamento.