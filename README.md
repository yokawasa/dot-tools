# dot-tools

A collection of utility tools that I use in my daily operations.

## Files & Directories

| Tool | Description |
| --- | --- |
| `afd` | Grep a pattern across all files under the current directory (skips `node_modules`) |
| `du-dir` | Show the top 20 entries with the highest disk usage under a given directory |
| `exclude` | Print lines of an input file that are not listed in an exclude file (`-i <input> -e <exclude>`) |
| `ff` | Fuzzy-find a file under the current directory with `fzf` |
| `goto` | Pick a directory under `$HOME/dev/github` with `fzf` and `cd` into it |
| `path` | Print the directory part of a given file path |
| `replace` | Replace a string in all files of a directory, writing results into `<dir>/t` |
| `tree` | Display a directory tree built from `find` output |

## Text / Data

| Tool | Description |
| --- | --- |
| `json-cat` | Pretty-print a JSON file with unicode escapes decoded |
| `json2yaml` | Convert a JSON file to YAML (requires [`yq`](https://github.com/kislyuk/yq)) |
| `seq` | Print numbers from 1 to N |
| `sum` | Sum numbers read from stdin |

## Process / Port

| Tool | Description |
| --- | --- |
| `killport` | Show the process listening on a port and kill it after a confirmation prompt |
| `kill-sa` | Kill all of your `ssh-agent` processes |
| `pskill` | Pick a process with `fzf` and kill it |

## Shell / Environment

| Tool | Description |
| --- | --- |
| `envish` | Load `KEY=VALUE` lines from an env file into the current shell (`source envish && envish <envfile>`) |
| `color` | Print the 256-color palette (bash / zsh) |
| `counter` | Print an incrementing counter with a timestamp every second |
| `rep` | Run a command repeatedly every second |
| `runcmd` | Run a command `<COUNT>` times with `<INTERVAL>` seconds in between |
| `tools` | List the tools I've been using recently |

## Date / Time

| Tool | Description |
| --- | --- |
| `datesof` | Print all dates of a given year/month as markdown headings (`datesof YYYY MM`) |
| `unixtime` | Print the current UNIX timestamp |

## Network / Web

| Tool | Description |
| --- | --- |
| `ch` | Search Chrome browser history with `fzf` and open the selected URL |
| `getns` | Look up the NS records of a domain |
| `is_200` | Poll a URL and print its HTTP status code in color (green for 200) |
| `weather` | Show the Tokyo weather forecast via `wttr.in` |

## Docker

| Tool | Description |
| --- | --- |
| `docker-clean.sh` | Prune stopped containers, unused volumes, images, and networks |
| `trivy` | Scan a container image with `aquasec/trivy` using a per-image local cache |
| `php-hello` | Run a throwaway `php:cli` container to verify Docker/PHP works |
| `alpha/composerize` | Convert a `docker run` command into docker-compose format (experimental) |

## Kubernetes

| Tool | Description |
| --- | --- |
| `kubectl-logs` | Pick a pod in a namespace with `fzf` and tail its logs |
| `kubectl-node-label` | List nodes with their status and the value of a given label (usable as a krew plugin) |

## AWS

| Tool | Description |
| --- | --- |
| `awscli` | Run the AWS CLI in a container with `~/.aws` and the current directory mounted |
| `_awp` | Config file: pick an AWS profile with `fzf` and export it — `source _awp` |
| `_aws-unset` | Config file: unset all `AWS_*` environment variables — `source _aws-unset` |

## Git / GitHub

| Tool | Description |
| --- | --- |
| `ghq-repo-create` | Create a private GitHub repo under `ghq` management with an initial commit |

## macOS

| Tool | Description |
| --- | --- |
| `mac-init.sh` | Install Homebrew and oh-my-zsh on a fresh Mac |
| `macos-version` | Show macOS software and version information |
| `ffmpeg/conv-mov2anigif` | Convert a `.mov` into a 2x-speed animated GIF (requires `ffmpeg`) |

## Notes

- Files prefixed with `_` are configuration files meant to be sourced (e.g. `source _awp`), not executed.
- `envish` also needs to be sourced since it modifies the current shell's environment.
- Many tools depend on [`fzf`](https://github.com/junegunn/fzf).
