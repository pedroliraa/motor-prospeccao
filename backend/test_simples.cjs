const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('data/F.K03200$W.SIMPLES.CSV.D60509', { encoding: 'latin1' })
});

rl.on('line', l => {
  if (l.includes('00778553')) {
    console.log('ENCONTRADO:', l);
    process.exit(0);
  }
});

rl.on('close', () => console.log('NAO ENCONTRADO'));