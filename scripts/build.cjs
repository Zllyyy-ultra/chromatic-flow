const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),files=['index.html','style.css','audio.js','evolution.js','app.js','project.json','preview.png'];
for(const dir of ['dist','wallpaper']){fs.mkdirSync(path.join(root,dir),{recursive:true});for(const file of files)fs.copyFileSync(path.join(root,file),path.join(root,dir,file));}
console.log('Prepared dist/ for Pages and wallpaper/ for Wallpaper Engine.');
