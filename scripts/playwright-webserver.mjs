import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "-p", "3100"], {
  stdio: "inherit",
  windowsHide: true,
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  child.kill("SIGTERM");
  setTimeout(() => process.exit(0), 1_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", () => {
  if (!child.killed) {
    child.kill("SIGTERM");
  }
});

child.on("exit", (code) => {
  if (!shuttingDown) {
    process.exit(code ?? 0);
  }
});
