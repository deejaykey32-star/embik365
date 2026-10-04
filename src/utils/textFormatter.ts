/**
 * Narzędzie do czyszczenia tekstu i usuwania niepożądanych znaków "Enter" (twardych łamań wierszy).
 * Łączy rozbite wiersze w płynne, wyjustowane obustronnie akapity o interlinii 1.15 i stylu Times New Roman.
 */

// Usuwa pojedyncze znaki nowej linii (Enter) wewnątrz akapitów, zachowując podział na właściwe akapity
export function cleanParagraphsFromEnters(rawText: string): string[] {
  if (!rawText) return [];

  // Standaryzacja znaków końca linii
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Podział na akapity według 2 lub więcej znaków nowej linii (\n\n+)
  const chunks = normalized.split(/\n\s*\n+/);
  const paragraphs: string[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    // Usuwamy pojedyncze znaki "Enter" wewnątrz akapitu, zastępując je spacją
    const cleaned = trimmed
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;:!?])/g, '$1')
      .trim();

    if (cleaned.length > 0) {
      paragraphs.push(cleaned);
    }
  }

  return paragraphs;
}

// Przygotowuje sformatowany kod HTML do wyświetlania na stronie z pełnym wyjustowaniem obustronnym
export function formatContentForReaderHtml(rawContent: string): string {
  if (!rawContent) return '';

  const normalized = rawContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Oddzielamy osadzone kontenery QR z HTML (np. materiały dodatkowe WnR)
  const qrPlaceholderMap: Map<string, string> = new Map();
  let placeholderIndex = 0;

  let textWithoutQr = normalized.replace(/<div class=['"]wnr-qr-container[\s\S]*?<\/div><\/div><\/div>/gi, (match) => {
    const key = `___QR_CONTAINER_PLACEHOLDER_${placeholderIndex++}___`;
    qrPlaceholderMap.set(key, match);
    return `\n\n${key}\n\n`;
  });

  // Dzielimy na akapity
  const rawParagraphs = textWithoutQr.split(/\n\s*\n+/);
  const htmlParts: string[] = [];

  for (let para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Jeśli to placeholder karty QR, wstawiamy go bezpośrednio
    if (qrPlaceholderMap.has(trimmed)) {
      htmlParts.push(qrPlaceholderMap.get(trimmed)!);
      continue;
    }

    // Obsługa nagłówków Markdown (#, ##, ###)
    if (trimmed.startsWith('# ')) {
      const title = trimmed.replace(/^#\s+/, '').trim();
      htmlParts.push(`<h1 class="font-heading-cinzel font-bold text-xl sm:text-2xl mt-6 mb-2 text-[#2a2016] dark:text-[#f3e8d2] text-center">${escapeHtml(title)}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const title = trimmed.replace(/^##\s+/, '').trim();
      htmlParts.push(`<h2 class="font-heading-cinzel font-bold text-lg sm:text-xl mt-5 mb-2 text-amber-900 dark:text-amber-300 text-center">${escapeHtml(title)}</h2>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^###\s+/, '').trim();
      htmlParts.push(`<h3 class="font-heading-cinzel font-bold text-base sm:text-lg mt-4 mb-1.5 text-stone-800 dark:text-stone-200 text-left">${escapeHtml(title)}</h3>`);
      continue;
    }
    if (trimmed === '---') {
      htmlParts.push(`<hr class="my-4 border-amber-600/25 dark:border-amber-500/20" />`);
      continue;
    }

    // Usuwamy pojedyncze znaki "Enter" wewnątrz akapitu (zamiana na spację)
    const cleanedText = trimmed
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;:!?])/g, '$1')
      .trim();

    if (!cleanedText) continue;

    // Przetwarzanie formatowania Markdown: **pogrubienie** oraz *kursywa*
    let formattedHtml = escapeHtml(cleanedText)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    htmlParts.push(`<p class="app-reading-para">${formattedHtml}</p>`);
  }

  return htmlParts.join('\n');
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
