import { handler } from "./index";

// This runs the Lambda locally
// command: node -r esbuild-register run.ts
const main = async () => {
  const res = await handler({} as any);
  console.log(res);
};

main();
