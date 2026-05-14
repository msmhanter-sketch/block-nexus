const fs = require('fs');
const files = ['Scene1.jsx', 'Scene2.jsx', 'Scene3.jsx', 'Scene4.jsx'];

files.forEach(f => {
  const path = 'src/components/' + f;
  let c = fs.readFileSync(path, 'utf8');
  
  // Fix keys for nodes
  c = c.replace(/key=\{i\}/g, "key={'k-'+i}");
  
  // Fix keys for txs
  c = c.replace(/key=\{tx.id\}/g, "key={'tx-'+tx.id}");
  
  // Fix keys for effects
  c = c.replace(/key=\{e.id\}/g, "key={'eff-'+e.id}");
  
  // Fix edges in Scene1 decentralized
  c = c.replace(/key=\{idx\}/g, "key={'edge-'+idx}");
  
  fs.writeFileSync(path, c);
  console.log('Fixed keys in', f);
});
