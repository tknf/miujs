const path = require("path");
const { execSync } = require("child_process");
const semver = require("semver");

const packageDirectory = path.resolve(__dirname, "../packages");

function getTaggedVersion() {
  const output = execSync(`git tag --list --opints-at HEAD`).toString().trim();
  return output.replace(/^v/g, "");
}

function publish(dir, tag) {
  execSync(`npm publish --access public --tag ${tag} ${dir}`, {
    stdio: "inherit"
  });
}

async function run() {
  const taggedVersion = getTaggedVersion();
  if (taggedVersion === "") {
    console.error(`Missing release version. Please run the version script first.`);
    process.exit(1);
  }

  const prerelease = semver.prerelease(taggedVersion);
  const prereleasetag = prerelease ? prerelease[0] : undefined;
  const tag = prereleasetag ? (prereleasetag.includes("canary") ? "canary" : prerelease) : "latest";

  for (const name of ["miujs", "create-miu"]) {
    publish(path.join(packageDirectory, name), tag);
  }
}

run().then(
  () => {
    process.exit(0);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
