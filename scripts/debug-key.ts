import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function debugPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) {
    console.error('No private key found in environment variables');
    return;
  }

  console.log('Raw key length:', key.length);
  console.log('Contains "BEGIN PRIVATE KEY":', key.includes('BEGIN PRIVATE KEY'));
  console.log('Contains "END PRIVATE KEY":', key.includes('END PRIVATE KEY'));
  console.log('Contains \\n:', key.includes('\\n'));
  console.log('Contains actual newlines:', key.includes('\n'));
  
  // Try to format the key
  const formattedKey = formatPrivateKey(key);
  console.log('\nFormatted key:');
  console.log(formattedKey);
}

function formatPrivateKey(key: string): string {
  // Remove the header and footer lines if they exist
  let cleanKey = key.replace('-----BEGIN PRIVATE KEY-----', '')
                    .replace('-----END PRIVATE KEY-----', '')
                    .replace(/\n/g, ''); // Remove all newlines

  // Clean up any remaining whitespace and quotes
  cleanKey = cleanKey.replace(/\s/g, '').replace(/"/g, '');
  
  // Add header and footer with proper newlines
  return `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
}

debugPrivateKey(); 