const { spawnSync } = require('child_process');
const fs = require('fs');

const { stdout, stderr } = spawnSync('npx', ['tsx', 'supabase/seed.ts'], { encoding: 'utf-8' });
fs.writeFileSync('error_out.txt', stderr || stdout);
