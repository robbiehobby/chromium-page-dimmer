import esbuild from "esbuild";
import process from "process";
import { spawn } from "child_process";

async function run() {
  const build = process.argv[2] === "build";
  const context = await esbuild.context({
    bundle: true,
    entryPoints: {
      "js/background": "src/js/background.ts",
      "js/content": "src/js/content.ts",
      "page/i18n": "src/page/i18n.ts",
      "page/main": "src/page/main.ts",
    },
    entryNames: "[dir]/[name]",
    format: "cjs",
    logLevel: "info",
    minify: build,
    outdir: "public",
    sourcemap: build ? false : "inline",
    target: "es2018",
    treeShaking: true,
  });

  const tw = spawn(
    "tailwindcss",
    ["-i", "./src/page/main.css", "-o", "./public/page/styles.css", build ? "--minify" : "--watch"],
    { stdio: "inherit" },
  );

  if (build) {
    await new Promise((resolve) => {
      tw.on("close", resolve);
    });
    await context.rebuild();
    process.exit(0);
  } else {
    process.on("SIGTERM", tw.kill);
    process.on("SIGINT", tw.kill);
    await context.watch();
  }
}

run();
