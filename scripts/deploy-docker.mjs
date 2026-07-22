import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const defaults = {
  image: "postor/genstory.cc",
  tag: "latest",
  container: "genstory-web",
  domain: "www.genstory.cc",
};

function readArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function readDotEnv(path) {
  if (!fs.existsSync(path)) return {};

  const env = {};
  for (const rawLine of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    const code = result.status ?? result.signal ?? "unknown";
    throw new Error(`${command} ${args.join(" ")} failed: ${code}`);
  }
}

function shQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

const dotEnv = readDotEnv(".env");
const args = readArgs(process.argv.slice(2));
const image = process.env.IMAGE || defaults.image;
const tag = process.env.TAG || defaults.tag;
const imageRef = `${image}:${tag}`;
const vps = process.env.VPS || dotEnv.VPS;
const container = process.env.CONTAINER || defaults.container;
const domain = process.env.DOMAIN || defaults.domain;
const transport = process.env.DEPLOY_TRANSPORT || args.transport || "registry";

if (!vps) {
  throw new Error("Missing VPS. Set VPS in .env or the environment.");
}

if (!["registry", "tar"].includes(transport)) {
  throw new Error(`Unsupported transport: ${transport}. Use registry or tar.`);
}

function remoteDeployScript({ pull = false, loadPath = "" } = {}) {
  return `
set -euo pipefail
IMAGE_REF=${shQuote(imageRef)}
CONTAINER=${shQuote(container)}
DOMAIN=${shQuote(domain)}
LOAD_PATH=${shQuote(loadPath)}

${pull ? 'docker pull "$IMAGE_REF"' : 'docker load -i "$LOAD_PATH"'}
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt:ro "$IMAGE_REF" nginx -t
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d \\
  --name "$CONTAINER" \\
  --restart unless-stopped \\
  -p 80:80 \\
  -p 443:443 \\
  -v /etc/letsencrypt:/etc/letsencrypt:ro \\
  "$IMAGE_REF"
docker inspect "$CONTAINER" --format 'status={{.State.Status}} image={{.Image}} restart={{.HostConfig.RestartPolicy.Name}}'
curl -fsS "https://$DOMAIN/healthz"
`;
}

function sshRun(script) {
  run("ssh", [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=30",
    "-o",
    "ServerAliveInterval=30",
    "-o",
    "ServerAliveCountMax=10",
    vps,
    "bash -s",
  ], {
    input: Buffer.from(script, "utf8"),
    stdio: ["pipe", "inherit", "inherit"],
  });
}

console.log(`Building ${imageRef}`);
run("docker", ["build", "--pull=false", "-t", imageRef, "."]);

if (transport === "registry") {
  console.log(`Pushing ${imageRef}`);
  try {
    run("docker", ["push", imageRef]);
  } catch (error) {
    console.error("");
    console.error("Docker push failed. Check Docker Hub login and Docker Desktop proxy/network settings.");
    console.error("If the registry is blocked from this machine, use: npm run deploy:docker:tar");
    throw error;
  }

  console.log(`Deploying ${imageRef} to ${vps} via docker pull`);
  sshRun(remoteDeployScript({ pull: true }));
} else {
  const tarPath = path.join(os.tmpdir(), `${container}-${tag}.tar`);
  const remoteTarPath = `/tmp/${container}-${tag}.tar`;

  console.log(`Saving ${imageRef} to ${tarPath}`);
  run("docker", ["save", "-o", tarPath, imageRef]);

  console.log(`Uploading ${tarPath} to ${vps}:${remoteTarPath}`);
  run("scp", [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=30",
    "-o",
    "ServerAliveInterval=30",
    "-o",
    "ServerAliveCountMax=10",
    tarPath,
    `${vps}:${remoteTarPath}`,
  ]);

  console.log(`Deploying ${imageRef} to ${vps} via docker load`);
  sshRun(`${remoteDeployScript({ loadPath: remoteTarPath })}
rm -f ${shQuote(remoteTarPath)}
`);

  fs.rmSync(tarPath, { force: true });
}

console.log(`Deployed ${imageRef} to https://${domain}`);
