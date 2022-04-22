#!/usr/bin/env node

// @ts-check
const fs = require("fs");
const path = require("path");
const argv = require("minimist")(process.argv.slice(2), { string: ["_"] });
const prompts = require("prompts");
const { yellow, blue, green, cyan, white, red, reset } = require("kolorist");

const cwd = process.cwd();

const SERVERS = [
  {
    name: "builtin",
    color: green,
    variants: [
      {
        name: "builtin",
        display: "JavaScript",
        color: yellow
      },
      {
        name: "builtin-ts",
        display: "TypeScript",
        color: blue
      }
    ]
  },
  {
    name: "vercel",
    color: white,
    variants: [
      {
        name: "vercel",
        display: "JavaScript",
        color: yellow
      },
      {
        name: "vercel-ts",
        display: "TypeScript",
        color: blue
      }
    ]
  },
  {
    name: "netlify",
    color: cyan,
    variants: [
      {
        name: "netlify",
        display: "JavaScript",
        color: yellow
      },
      {
        name: "netlify-ts",
        display: "TypeScript",
        color: blue
      }
    ]
  }
];

const TEMPLATES = SERVERS.map((s) => s.variants.map((v) => v.name)).reduce((a, b) => a.concat(b), []);

const renameFiles = {
  _gitignore: `.gitignore`
};

async function init() {
  let targetDir = argv._[0];
  let template = argv.template;

  const defaultProjectName = !targetDir ? `miujs-website` : targetDir;

  let result = {};

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultProjectName,
          onState: (state) => (targetDir = state.value.trim() || defaultProjectName)
        },
        {
          type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm"),
          name: "overwrite",
          message: () =>
            `${
              targetDir === "." ? `Current directory` : `Target directory ${targetDir}`
            } is not empty. Remove existing files and continue?`
        },
        {
          type: (_, a) => {
            if (a?.overwrite === false) {
              throw new Error(`${red(`Error!`)} Operation cancelled`);
            }
            return null;
          },
          name: `overwriteChecker`
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(targetDir),
          validate: (dir) => isValidPackageName(dir) || `Invalid package.json name`
        },
        {
          type: template && TEMPLATES.includes(template) ? null : "select",
          name: "server",
          message:
            template && !TEMPLATES.includes(template)
              ? reset(`"${template}" is not a valid template. Please choose from below: `)
              : reset(`Select a server target:`),
          initial: 0,
          choices: SERVERS.map((t) => {
            return {
              title: t.color(t.name),
              value: t
            };
          })
        },
        {
          type: (server) => (server && server.variants ? "select" : null),
          name: "language",
          message: reset(`Select language type:`),
          // eslint-disable-next-line
          // @ts-ignore
          choices: (server) =>
            server.variants.map((v) => {
              return {
                title: v.color(v.name),
                value: v.name
              };
            })
        }
      ],
      {
        onCancel: () => {
          throw new Error(`${red(`Error!`)} Operation cancelled`);
        }
      }
    );
  } catch (cancelled) {
    console.log(cancelled.message);
    return;
  }

  const { overwrite, packageName, server, language } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  template = language || server || template;

  console.log(`\n✨ Creating project in ${root} ...`);

  const templateDir = path.join(__dirname, `template-${template}`);

  const write = (file, content) => {
    const targetPath = renameFiles[file] ? path.join(root, renameFiles[file]) : path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }

  const pkg = require(path.join(templateDir, "package.json"));
  pkg.name = packageName || targetDir;
  write("package.json", JSON.stringify(pkg, null, 2));

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";

  console.log(`\n✨ Done. Now run:`);
  if (root !== cwd) {
    console.log(` cd ${path.relative(cwd, root)}`);
  }
  switch (pkgManager) {
    case "yarn": {
      console.log(`   yarn`);
      console.log(`   yarn dev`);
      break;
    }
    default: {
      console.log(`   ${pkgManager} install`);
      console.log(`   ${pkgManager} run dev`);
      break;
    }
  }

  console.log();
}

function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~]+/g, "-");
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function isEmpty(path) {
  return fs.readdirSync(path).length === 0;
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file);
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs);
      fs.rmdirSync(abs);
    } else {
      fs.unlinkSync(abs);
    }
  }
}

/**
 * @param {string | undefined} userAgent process.env.npm_config_user_agent
 * @returns object | undefined
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  };
}

init().catch((e) => {
  console.error(e);
});
