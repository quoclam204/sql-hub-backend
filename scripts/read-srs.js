const fs = require('fs');
const zlib = require('zlib');

try {
  const buffer = fs.readFileSync('docs/SRS-SQLHub.docx');
  let offset = 0;
  let xmlContent = '';

  while (offset < buffer.length - 4) {
    if (buffer.readUInt32LE(offset) === 0x04034b50) {
      const compression = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraFieldLen = buffer.readUInt16LE(offset + 28);

      const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLen);
      const dataStart = offset + 30 + fileNameLen + extraFieldLen;
      const dataEnd = dataStart + compressedSize;

      if (fileName === 'word/document.xml') {
        const compressedData = buffer.slice(dataStart, dataEnd);
        let uncompressed;
        if (compression === 8) {
          uncompressed = zlib.inflateRawSync(compressedData);
        } else if (compression === 0) {
          uncompressed = compressedData;
        } else {
          throw new Error('Unsupported compression: ' + compression);
        }
        xmlContent = uncompressed.toString('utf8');
        break;
      }
      offset = dataEnd;
    } else {
      offset++;
    }
  }

  if (!xmlContent) {
    console.error('word/document.xml not found');
    process.exit(1);
  }

  const text = xmlContent
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<w:tab[^>]*>/g, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();

  fs.writeFileSync('docs/SRS-SQLHub.txt', text, 'utf8');
  console.log('EXTRACT_SUCCESS');
  console.log(text);
} catch (err) {
  console.error('Error extracting docx:', err);
  process.exit(1);
}
