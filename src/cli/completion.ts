import {
  commandPathsForCompletion,
  endpointManifest,
  globalOptions,
} from "./manifest";

type SupportedShell = "bash" | "zsh" | "fish";

const parseFlagNames = (flags: string): string[] => {
  const matches = flags.match(/--[a-z0-9-]+|-[a-z]/gi) ?? [];
  return matches;
};

const optionFlagsByPath = new Map<string, string[]>();
const valueFlags = new Set<string>();

for (const endpoint of endpointManifest) {
  const key = endpoint.path.join(" ");
  const names: string[] = [];

  for (const option of [...globalOptions, ...endpoint.options]) {
    const parsed = parseFlagNames(option.flags);
    names.push(...parsed);
    if (option.type !== "boolean") {
      for (const flag of parsed) {
        valueFlags.add(flag);
      }
    }
  }

  optionFlagsByPath.set(key, [...new Set(names)]);
}

optionFlagsByPath.set("config set", ["--json"]);
valueFlags.add("--json");

const visibleCommandPaths = commandPathsForCompletion().filter(
  (path) => path[0] !== "__complete"
);

const unique = (values: string[]): string[] => [...new Set(values)];

const extractCommandTokens = (words: string[]): string[] => {
  const commandTokens: string[] = [];
  let skipValue = false;

  for (const word of words) {
    if (skipValue) {
      skipValue = false;
      continue;
    }

    if (word.startsWith("-")) {
      const [flagName] = word.split("=", 2);
      if (flagName && valueFlags.has(flagName) && !word.includes("=")) {
        skipValue = true;
      }
      continue;
    }

    if (commandTokens.length < 2) {
      commandTokens.push(word);
    }
  }

  return commandTokens;
};

const flagsForPath = (path: string[]): string[] => {
  if (path.length === 0) {
    return [];
  }

  const key = path.join(" ");
  return optionFlagsByPath.get(key) ?? [];
};

export const completeWords = (args: {
  words: string[];
  hasTrailingSpace: boolean;
}): string[] => {
  const current = args.hasTrailingSpace ? "" : (args.words.at(-1) ?? "").trim();
  const consumed = args.hasTrailingSpace ? args.words : args.words.slice(0, -1);

  const commandTokens = extractCommandTokens(consumed);

  if (current.startsWith("-")) {
    return flagsForPath(commandTokens)
      .filter((flag) => flag.startsWith(current))
      .toSorted();
  }

  const candidatePaths = visibleCommandPaths.filter((path) =>
    commandTokens.every((segment, index) => path[index] === segment)
  );

  if (candidatePaths.length === 0) {
    return visibleCommandPaths
      .map((path) => path[0] ?? "")
      .filter((segment) => segment.startsWith(current))
      .toSorted();
  }

  const nextSegments = unique(
    candidatePaths
      .map((path) => path[commandTokens.length])
      .filter((segment): segment is string => typeof segment === "string")
  )
    .filter((segment) => segment.startsWith(current))
    .toSorted();

  if (nextSegments.length > 0) {
    return nextSegments;
  }

  return flagsForPath(commandTokens)
    .filter((flag) => flag.startsWith(current))
    .toSorted();
};

const scriptByShell = {
  bash: (bin: string) => `_${bin}_complete() {
  local IFS=$'\\n'
  local line="$COMP_LINE"
  local has_trailing_space=0
  [[ "$line" == *" " ]] && has_trailing_space=1
  COMPREPLY=( $( ${bin} __complete "$has_trailing_space" \${COMP_WORDS[@]:1} ) )
}
complete -F _${bin}_complete ${bin}
`,
  zsh: (bin: string) => `#compdef ${bin}
_${bin}_complete() {
  local -a suggestions
  local line="$BUFFER"
  local has_trailing_space=0
  [[ "$line" == *" " ]] && has_trailing_space=1
  suggestions=($(${bin} __complete "$has_trailing_space" \${words[@]:1}))
  _describe 'values' suggestions
}
compdef _${bin}_complete ${bin}
`,
  fish: (bin: string) => `function __${bin}_complete
  set -l line (commandline -cp)
  set -l has_trailing_space 0
  if string match -q '* ' -- "$line"
    set has_trailing_space 1
  end
  ${bin} __complete $has_trailing_space (commandline -opc | tail -n +2)
end
complete -c ${bin} -f -a "(__${bin}_complete)"
`,
} as const;

export const renderCompletionScript = (
  shell: string,
  binaryName = "trendsearch"
): string | undefined => {
  if (shell === "bash" || shell === "zsh" || shell === "fish") {
    const renderer = scriptByShell[shell as SupportedShell];
    return renderer(binaryName);
  }

  return undefined;
};
