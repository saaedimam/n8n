#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), '.workflows', '_import-report.json');
const add = JSON.parse(process.argv[2]);

const arr = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : [];
arr.push(add);
fs.writeFileSync(reportPath, JSON.stringify(arr, null, 2));
console.log('ok');
