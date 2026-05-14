const fs = require('fs');
const files = ['Scene1.jsx', 'Scene2.jsx', 'Scene3.jsx', 'Scene4.jsx'];
files.forEach(f => {
  const path = 'c:/block-nexus/src/components/' + f;
  let c = fs.readFileSync(path, 'utf8');
  
  // Replace white text with dark text
  c = c.replace(/color=['"]#ffffff['"]/g, 'color="#111111"');
  c = c.replace(/color=['"]#fff['"]/g, 'color="#111"');
  c = c.replace(/color=['"]white['"]/g, 'color="#111111"');
  
  // Replace dark backgrounds/materials with light ones
  c = c.replace(/color=['"]#000['"]/g, 'color="#ffffff"');
  c = c.replace(/color=['"]#000000['"]/g, 'color="#ffffff"');
  c = c.replace(/color=['"]#050505['"]/g, 'color="#f5f5f7"');
  c = c.replace(/color=['"]#020202['"]/g, 'color="#f0f0f2"');
  c = c.replace(/color=['"]#111111['"]/g, 'color="#e0e0e0"');
  
  // Fix outlines for dark text (was outlineColor='#000')
  c = c.replace(/outlineColor=['"]#000['"]/g, 'outlineColor="#ffffff"');
  c = c.replace(/outlineColor=['"]#000000['"]/g, 'outlineColor="#ffffff"');

  // Fix opacities if needed, but simple replacement should be enough
  fs.writeFileSync(path, c);
  console.log('Updated', f);
});
