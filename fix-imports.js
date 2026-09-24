const fs = require('fs');
const path = require('path');
const apiSrc = 'C:/Proyectos dip/Dip/apps/api/src';

function fixDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixDir(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      // Fix shared imports from 3-level to 4-level paths
      newContent = newContent.replace(/from '..\/..\/shared\/validators'/g, "from '../../../shared/validators'");
      newContent = newContent.replace(/from '..\/..\/shared\/responses\/response-helper'/g, "from '../../../shared/responses/response-helper'");
      newContent = newContent.replace(/from '..\/..\/shared\/errors\/app-error'/g, "from '../../../shared/errors/app-error'");
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Fixed:', fullPath.replace(apiSrc + '/', ''));
      }
    }
  }
}

fixDir(apiSrc);
console.log('Done fixing shared import paths.');
