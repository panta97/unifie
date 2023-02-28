# unifie
consolidate all projects for kdosh company


# steps to fix: React refers to UMD global

rm -rf node_modules
rm -f yarn.lock
npm cache clean --force
yarn install

Agregate in component: `import React from 'react'`