# Emeji Connection Monitor

<img width="799" alt="screenshot" src="https://github.com/elliottmejia/Emeji-Connection-Monitor/assets/8883736/4fda0dd2-49b0-4bdd-9afe-77df745b711e">


A simple utility I created to log internet connectivity issues, as my ISP is struggling to pin down why my internet speeds resemble a square wave somewhere between the switch and my twice-replaced router. 

This utility monitors three states:
1. Internet fully works.
2. Machine is connected to the router, but not the information superhighway.
3. Machine is not connected to the router or the information superhighway.

The utility can export logs of these states.

Since my speeds are pretty much boolean, monitoring speed over time is out of scope. Like the Sith, this monitor deals in absolutes.

To build from source:
```bash
# 1. Clone the repo
git clone https://github.com/elliottmejia/Emeji-Connection-Monitor
# 2. Install a few deps
npm i
# 3. Build
npm build
```
Optionally, you can just run from source.
```bash
# ... steps 1, 2...
# 3. Start server in dev mode
npm start
```

Untested on Linux and Windows. It *should* work.

## Builds

[OSX (ARM64)](https://www.dropbox.com/scl/fi/nn3dqvy23rp77qoadbxpj/Emeji-Connection-Monitor-1.0.0-arm64.dmg?rlkey=6o9ldd9lp9twuynodulhs63gb&dl=0)
