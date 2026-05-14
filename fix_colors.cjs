const fs = require('fs');
const files = ['Scene1.jsx', 'Scene2.jsx', 'Scene3.jsx', 'Scene4.jsx'];
files.forEach(f => {
  const path = 'c:/block-nexus/src/components/' + f;
  let c = fs.readFileSync(path, 'utf8');
  
  // Fix the cascading replacement bug
  c = c.replace(/color=['"]#e0e0e0['"]/g, 'color="#111111"');
  
  fs.writeFileSync(path, c);
  console.log('Fixed', f);
});
