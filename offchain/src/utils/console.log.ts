import fs from "fs";
import path from "path";
import assert from "assert";
import { Semaphore } from "../chain/agents/semaphore";
import { slotDurationMs } from "./constants";

// Define the path to the logs directory
console.log("Current working directory:", process.cwd());
const logsDir = "./offchain/logs";

// Function to delete all files in the logs directory
/**
 *
 */
const deleteAllLogFiles = async () => {
  try {
    const entries = await fs.promises.readdir(logsDir, {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".log")) {
        // Construct the full path to the file
        const filePath = path.join(logsDir, entry.name);
        // Remove the file
        await fs.promises.unlink(filePath);
        console.log(`Deleted: ${filePath}`);
      }
    }
    console.log("All log files deleted successfully.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error deleting files in ${logsDir}:`, error.message);
    } else {
      console.error(`Unexpected error:`, error);
    }
  }
};

// Call the function to delete all log files
// await
deleteAllLogFiles();

// Create a new custom console.log function
const originalLog = console.log;
const semaphores = new Map();
const startTime = Date.now();
const ellypsis = `*`;

/**
 *
 * @param {...any} args
 */
console.log = async (...args) => {
  const circaSlot = `[${(Date.now() - startTime) / slotDurationMs}]`;

  if (args.length && typeof args[0] === `string`) {
    const arg0 = args[0];
    const from = arg0.indexOf(`[`);
    const to = arg0.indexOf(`]`);
    if (from === -1 || to === -1 || to - from <= 1) {
      // If no prefix, just log normally
      originalLog(circaSlot, ...args);
      return;
    }
    const fullName = arg0.slice(from + 1, to);
    const nameAll = fullName.split(` `)[0];
    const nameDetail = fullName;

    const handle = `CONSOLE.LOG [${nameAll}]`;
    let semaphore = semaphores.get(nameAll);
    if (!semaphore) {
      semaphore = new Semaphore(handle, false);
      semaphores.set(nameAll, semaphore);
    }
    const id = await semaphore.latch(handle);
    const slotIndent = ` `.repeat(circaSlot.length + 1);

    for (const name of [nameAll, nameDetail]) {
      assert(name, `console.log: name is empty`);
      const nameRegExp = new RegExp(name, "g");
      const filename = path.join(logsDir, `${name}.log`);
      const msgPrefix = arg0.replace(/\n/g, `\n${slotIndent}`);
      await fs.promises.writeFile(
        filename,
        `${circaSlot} ${msgPrefix.replace(nameRegExp, ellypsis)}`,
        { flag: "a" },
      );
      for (let i = 1; i < args.length; i++) {
        let argi = args[i];
        if (argi === undefined) {
          argi = `undefined`;
        } else if (typeof argi === `string`) {
          argi = argi
            .replace(/\n/g, `\n${slotIndent}`)
            .replace(nameRegExp, ellypsis);
        } else {
          for (const fn of [
            () => JSON.stringify(argi),
            () => argi.concise,
            argi.concise,
            () => argi.show,
            argi.show,
          ]) {
            try {
              const str = fn();
              assert(typeof str === `string`);
              argi = str
                .replace(/\n/g, `\n${slotIndent}`)
                .replace(nameRegExp, ellypsis);
              break;
            } catch {
              argi = `???`;
            }
          }
        }
        await fs.promises.writeFile(filename, ` ${argi}`, {
          flag: "a",
        });
      }
      await fs.promises.writeFile(filename, `\n`, {
        flag: "a",
      });
    }
    semaphore.discharge(id);
  } else {
    // If no prefix, just log normally
    originalLog(circaSlot, ...args);
  }
};
