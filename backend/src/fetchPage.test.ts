import { stripHtml } from './fetchPage';

describe('stripHtml', () => {
  it('strips tags and preserves line breaks from block elements', () => {
    const html = '<p>Amazing grace</p><p>How sweet the sound</p>';
    expect(stripHtml(html)).toBe('Amazing grace\nHow sweet the sound');
  });

  it('converts <br> tags to newlines', () => {
    const html = 'Amazing grace<br>How sweet the sound<br/>That saved a wretch';
    expect(stripHtml(html)).toBe('Amazing grace\nHow sweet the sound\nThat saved a wretch');
  });

  it('removes script and style content entirely', () => {
    const html = '<style>.foo{color:red}</style><script>alert(1)</script><p>Real lyric line</p>';
    expect(stripHtml(html)).toBe('Real lyric line');
  });

  it('removes html comments', () => {
    const html = '<p>Line one</p><!-- an ad slot --><p>Line two</p>';
    expect(stripHtml(html)).toBe('Line one\nLine two');
  });

  it('decodes common named entities', () => {
    const html = "<p>Rock &amp; Roll &mdash; it&#39;s alright</p>";
    expect(stripHtml(html)).toBe("Rock & Roll — it's alright");
  });

  it('decodes numeric entities', () => {
    const html = '<p>caf&#233;</p>';
    expect(stripHtml(html)).toBe('café');
  });

  it('drops blank lines produced by empty tags', () => {
    const html = '<div></div><p>Real line</p><div>   </div>';
    expect(stripHtml(html)).toBe('Real line');
  });

  it('collapses runs of internal whitespace on a line', () => {
    const html = '<p>Too    many     spaces</p>';
    expect(stripHtml(html)).toBe('Too many spaces');
  });
});
