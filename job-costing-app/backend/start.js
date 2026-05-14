// Wrapper to run TypeScript backend
const { spawn } = require('child_process');

// Get port from environment or default
const port = process.env.PORT || 3001;

// Run the demo server using ts-node with CommonJS
const child = spawn(
  process.execPath,
  ['-r', 'ts-node/register', 'src/demo-server.ts', '--', '--port', port],
  {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  }
);

child.on('exit', (code) => {
  process.exit(code || 0);
});