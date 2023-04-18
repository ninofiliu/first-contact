#!/bin/sh
echo 'export default [' >src/files.ts
echo public/media/**/*.* | fmt -w 0 | colrm 1 6 | sed "s/^/'/" | sed "s/$/',/" >>src/files.ts
echo ']' >>src/files.ts
pnpm exec prettier -w src/files.ts
