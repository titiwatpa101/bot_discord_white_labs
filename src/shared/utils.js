function splitMessage(text, limit = 2000) {
  if (text.length <= limit) return [text];
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (current.length + line.length + 1 > limit) {
      if (current) chunks.push(current.trimEnd());
      current = line + '\n';
    } else {
      current += line + '\n';
    }
  }
  if (current.trim()) chunks.push(current.trimEnd());
  return chunks;
}

module.exports = { splitMessage };
