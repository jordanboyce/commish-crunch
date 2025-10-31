#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

console.log('🔍 Checking static build...');

// Check if out directory exists
if (!fs.existsSync(outDir)) {
  console.error('❌ Build failed: out/ directory not found');
  console.log('Run: pnpm run build');
  process.exit(1);
}

// Check for essential files
const requiredFiles = [
  'index.html',
  '_next/static',
  'calculator.svg',
  'calculator.png'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(outDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

if (allFilesExist) {
  console.log('\n🎉 Static build looks good!');
  console.log(`📁 Deploy the contents of: ${outDir}`);
  
  // Get build size
  const getDirectorySize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
    
    return size;
  };
  
  const sizeBytes = getDirectorySize(outDir);
  const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
  console.log(`📊 Total size: ${sizeMB} MB`);
} else {
  console.error('\n❌ Build verification failed');
  process.exit(1);
}