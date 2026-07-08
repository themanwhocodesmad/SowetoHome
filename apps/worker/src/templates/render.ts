export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderTemplate(subject: string, bodyLines: string[]): RenderedEmail {
  const text = bodyLines.join('\n\n');
  const html = [
    '<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">',
    '<h2 style="color:#0e3e66;">BookMyStay</h2>',
    ...bodyLines.map((line) => `<p>${line}</p>`),
    '</div>',
  ].join('\n');
  return { subject, html, text };
}
