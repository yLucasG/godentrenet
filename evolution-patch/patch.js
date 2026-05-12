const fs = require('fs');

const FIND = 'g||(g=l.find(y=>y.jid===u.jid));let h=g?.jid||u.jid;return{exists:!!g?.exists,jid:h,name:n.find(y=>y.remoteJid===h)?.pushName,number:u.number}';
const REPLACE = 'g||(g=l.find(y=>y.jid===u.jid));if(!g&&u.jid&&u.jid.endsWith("@lid"))return{exists:!0,jid:u.jid,name:n.find(y=>y.remoteJid===u.jid)?.pushName,number:u.number};let h=g?.jid||u.jid;return{exists:!!g?.exists,jid:h,name:n.find(y=>y.remoteJid===h)?.pushName,number:u.number}';

const files = [
  '/evolution/dist/main.js',
  '/evolution/dist/main.mjs',
  '/evolution/dist/api/integrations/channel/whatsapp/whatsapp.baileys.service.js',
  '/evolution/dist/api/integrations/channel/whatsapp/whatsapp.baileys.service.mjs',
];

let patched = 0;
for (const path of files) {
  try {
    let code = fs.readFileSync(path, 'utf8');
    if (!code.includes(FIND)) {
      if (!code.includes('endsWith("@lid")')) {
        console.log(path + ': pattern not found (may be ok if already patched or different bundle)');
      }
      continue;
    }
    fs.writeFileSync(path, code.replace(FIND, REPLACE), 'utf8');
    console.log(path + ': @lid patch applied');
    patched++;
  } catch (e) {
    console.log(path + ': ' + e.message);
  }
}
console.log('Total files patched:', patched);
