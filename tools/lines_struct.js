// Dumps DATA.LINES by key + want lines + other literals (for tools/script_pdf.py)
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=require('path').join(__dirname,'..','src');const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(SRC,'data.js'),'utf8')+'\nthis.DATA=DATA;',ctx);
const D=ctx.DATA;const all=JSON.parse(require('child_process').execSync('node '+require('path').join(__dirname,'lines.js')+'',{cwd:'/data'}).toString());
const inL=new Set();for(const k in D.LINES)for(const s of D.LINES[k])inL.add(s.trim());
const want=[];for(const id of D.FOOD_ORDER){const f=D.FOODS[id];if(!f.nonfood)want.push('Хочу '+(f.acc||f.name.toLowerCase())+'!');}
const misc=all.filter(s=>!inL.has(s)&&!want.includes(s));
console.log(JSON.stringify({LINES:D.LINES,want,misc,total:all.length},null,0));
