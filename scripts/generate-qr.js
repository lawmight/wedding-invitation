const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Randomized content: placeholder URL with random suffix so the QR is unique
const randomId = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
const content = `https://example.com/coffee/${randomId}`;

const outPath = path.join(__dirname, '..', 'qr_for_coffee.png');

QRCode.toFile(outPath, content, { width: 256, margin: 2 }, (err) => {
  if (err) {
    console.error('Failed to generate QR code:', err);
    process.exit(1);
  }
  console.log('QR code written to:', outPath);
  console.log('Encoded content:', content);
});
