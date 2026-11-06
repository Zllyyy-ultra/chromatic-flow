const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),files=['index.html','style.css','audio.js','evolution.js','app.js','project.json'];
for(const dir of ['dist','wallpaper']){const destination=path.join(root,dir);fs.mkdirSync(destination,{recursive:true});const oldPreview=path.join(destination,'preview.png');if(fs.existsSync(oldPreview))fs.unlinkSync(oldPreview);for(const file of files)fs.copyFileSync(path.join(root,file),path.join(destination,file));}
console.log('Prepared dist/ for Pages and wallpaper/ for Wallpaper Engine.');
