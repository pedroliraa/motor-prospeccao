const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('data/K3241.K03200Y0.D60509.EMPRECSV', { encoding: 'latin1' })
});

let count = 0;
rl.on('line', line => {
  if (count < 5) {
    const cols = line.split(';').map(c => c.replace(/"/g, '').trim());
    console.log(`Linha ${count}:`, cols);
    count++;
  } else {
    rl.close();
  }
});