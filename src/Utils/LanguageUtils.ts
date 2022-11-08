export type Program = {
  commands: Command[];
  labels: { [index: string]: number };
};

export type CommandType = "add" | "remove" | "test" | "jump" | "swap" | "dump" | "stop";

export type Command = {
  command: CommandType;
  arguments: number[];
  targetLabel?: string;
};

export type SimulationStep = {
  command: Command;
  ic: number;
  stateAfterStep: number[];
};

export type Simulation = {
  status: "success" | "fail";
  input: number[];
  steps: SimulationStep[];
};

export const parseCode = (rawCode: string) => {
  const cleanedCode = rawCode.toLowerCase().replace(/\s+/g, "");
  if (cleanedCode.length === 0 || cleanedCode[cleanedCode.length - 1] !== ";") return undefined;
  const splitted = cleanedCode.substring(0, cleanedCode.length - 1).split(";");
  const result = { commands: [], labels: {} } as Program;
  let ok = true;
  splitted.forEach((act, i) => {
    if (containsLabel(act)) {
      if (testLabelSyntax(extractLabel(act) as string)) result.labels[extractLabel(act) as string] = i;
      else ok = false;
    }
    const command = parseCommand(removeLabel(act));
    if (command === undefined) ok = false;
    else result.commands.push(command);
  });
  if (!result.commands.map((c) => c.command !== "jump" || Object.keys(result.labels).includes(c.targetLabel || "")).reduce((x, y) => x && y, true))
    return undefined;
  return ok ? result : undefined;
};

export const simulateProgram = (program: Program, input: number[]) => {
  const result = { input: stripRight(input), status: "success", steps: [] } as Simulation;
  let state = input;
  let ic = 0;
  while (true) {
    if (result.steps.length > 10000) {
      result.status = "fail";
      break;
    }
    const { status, newState, newIc } = simulateStep(ic, program, state);
    if (status === "failed") {
      result.status = "fail";
      break;
    }
    result.steps.push({
      command: { ...program.commands[ic] },
      ic: ic,
      stateAfterStep: [...newState],
    });
    ic = newIc;
    state = newState;
    if (status === "finished") break;
  }
  return result;
};

const simulateStep = (ic: number, program: Program, state: number[]) => {
  if (ic < 0 || ic >= program.commands.length)
    return {
      status: "failed",
      newState: [],
      newIc: -1,
    };
  const cmd = program.commands[ic];
  if (cmd.command === "add") {
    return {
      status: "ok",
      newState: stripRight(enlargeState(state, Math.max(0, ...cmd.arguments)).map((x, i) => (cmd.arguments.includes(i) ? x + 1 : x))),
      newIc: ic + 1,
    };
  } else if (cmd.command === "remove") {
    return {
      status: "ok",
      newState: stripRight(enlargeState(state, Math.max(0, ...cmd.arguments)).map((x, i) => (cmd.arguments.includes(i) && x > 0 ? x - 1 : x))),
      newIc: ic + 1,
    };
  } else if (cmd.command === "dump") {
    const newState = enlargeState(state, Math.max(...cmd.arguments));
    if (cmd.arguments.length === 1) {
      newState[cmd.arguments[0]] = 0;
    } else {
      newState[cmd.arguments[1]] += newState[cmd.arguments[0]];
      newState[cmd.arguments[0]] = 0;
    }
    return {
      status: "ok",
      newState: stripRight(newState),
      newIc: ic + 1,
    };
  } else if (cmd.command === "swap") {
    const newState = enlargeState(state, Math.max(...cmd.arguments));
    const help = newState[cmd.arguments[0]];
    newState[cmd.arguments[0]] = newState[cmd.arguments[1]];
    newState[cmd.arguments[1]] = help;
    return {
      status: "ok",
      newState: stripRight(newState),
      newIc: ic + 1,
    };
  } else if (cmd.command === "jump") {
    return {
      status: "ok",
      newState: [...state],
      newIc: program.labels[cmd.targetLabel || ""],
    };
  } else if (cmd.command === "stop") {
    return {
      status: "finished",
      newState: [...state],
      newIc: -1,
    };
  } else if (cmd.command === "test") {
    const isFulfilled = enlargeState(state, Math.max(...cmd.arguments))
      .map((x, i) => (cmd.arguments.includes(i) ? x === 0 : true))
      .reduce((a, b) => a && b, true);
    return {
      status: "ok",
      newState: [...state],
      newIc: isFulfilled ? ic + 1 : ic + 2,
    };
  }
  return {
    status: "failed",
    newState: [],
    newIc: -1,
  };
};

export const stripRight = (state: number[]) =>
  state.reduceRight((acc, item) => (item === 0 && acc.length === 0 ? acc : acc.concat(item)), [] as number[]).reverse();

export const enlargeState = (state: number[], requestedMinIndex: number) =>
  state.length > requestedMinIndex ? state : [...state, ...Array.from(new Array(1 + requestedMinIndex - state.length)).map((_) => 0)];

const containsLabel = (rawCommand: string) => rawCommand.includes(":");

const extractLabel = (rawCommand: string) => (containsLabel(rawCommand) ? rawCommand.split(":")[0] : undefined);

const removeLabel = (rawCommand: string) => (containsLabel(rawCommand) ? rawCommand.split(":")[1] : rawCommand);

const testLabelSyntax = (label: string) => /^[a-z\d]+$/.test(label);

const testCommandSyntax = (rawCommand: string) =>
  /^(add)|(remove)|(test)|(swap)|(dump)|(stop)\(([\d]+(,[\d]+)*)?\)$/.test(rawCommand) || /^jump\([a-z\d]+\)$/.test(rawCommand);

const getCommandType = (rawCommand: string) => {
  if (rawCommand.startsWith("add")) return "add" as CommandType;
  else if (rawCommand.startsWith("remove")) return "remove" as CommandType;
  else if (rawCommand.startsWith("test")) return "test" as CommandType;
  else if (rawCommand.startsWith("jump")) return "jump" as CommandType;
  else if (rawCommand.startsWith("swap")) return "swap" as CommandType;
  else if (rawCommand.startsWith("dump")) return "dump" as CommandType;
  else if (rawCommand.startsWith("stop")) return "stop" as CommandType;
  else return undefined;
};

const extractNumericArguments = (rawCommand: string) => {
  const argsPart = rawCommand.substring(rawCommand.indexOf("(") + 1, rawCommand.length - 1);
  if (argsPart.length === 0) return [];
  return argsPart.split(",").map((a) => parseInt(a));
};

const extractTargetLabel = (rawCommand: string) => rawCommand.substring(rawCommand.indexOf("(") + 1, rawCommand.length - 1);

const parseCommand = (rawCommand: string) => {
  if (!testCommandSyntax(rawCommand)) return undefined;
  const commandType = getCommandType(rawCommand);
  if (commandType === undefined) return undefined;
  const args = commandType === "jump" ? [] : extractNumericArguments(rawCommand);
  const target = commandType === "jump" ? extractTargetLabel(rawCommand) : undefined;
  if (commandType === "stop" && args.length !== 0) return undefined;
  if (commandType === "swap" && args.length !== 2) return undefined;
  if (commandType === "dump" && args.length !== 1 && args.length !== 2) return undefined;
  return {
    arguments: args,
    command: commandType,
    targetLabel: target,
  } as Command;
};

export const commandToString = (command: Command) => command.command.toUpperCase() + "(" + command.arguments.join(",") + (command.targetLabel || "") + ");";
