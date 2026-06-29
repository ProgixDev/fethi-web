#!/usr/bin/env node

// Deterministic agent-board driver (fethi-web).
//
//   node scripts/agent-board.mjs next [--lane "Dev A"]  -> next buildable task
//   node scripts/agent-board.mjs list                   -> board summary
//   node scripts/agent-board.mjs set-status <id> <col>  -> move a task + sync board.md
//
// A task is "buildable" when its status is Backlog or Ready and every task in
// its blockedBy list is Done. Candidates are ordered by priority then id.
//
// fethi-web is the DB OWNER. A task whose blockedBy contains an "SCR-" id is
// blocked on a Schema Change Request (docs/db/decisions/). Those are resolved
// AUTOMATICALLY against the canonical manifest `supabase/applied-scrs.json`: an
// SCR blocker counts as Done iff it is in that manifest's `applied` list. This
// replaces the old "tracked manually" scheme, which went stale (e.g. WEB-011
// gated on the whole WEB-008 task when its real dependency — the reports/
// blocked_users schema — already shipped via the accepted SCR-005). Any other
// unknown blocker id still counts as NOT Done.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_JSON = path.join(ROOT, '.agent-board', 'board.json');
const BOARD_MD = path.join(ROOT, '.agent-board', 'board.md');
const APPLIED_SCRS = path.join(ROOT, 'supabase', 'applied-scrs.json');

const COLUMNS = ['Backlog', 'Ready', 'In Progress', 'Review', 'Blocked', 'Done'];
const BUILDABLE_FROM = new Set(['Backlog', 'Ready']);
const ID_PREFIX = 'WEB-';

function readBoard() {
  return JSON.parse(readFileSync(BOARD_JSON, 'utf8'));
}

function priorityRank(priority) {
  const match = /P(\d+)/.exec(priority ?? '');
  return match ? Number(match[1]) : 99;
}

/** Set of accepted/applied SCR ids, read from the canonical manifest. */
function readAppliedScrs() {
  try {
    return new Set(JSON.parse(readFileSync(APPLIED_SCRS, 'utf8')).applied ?? []);
  } catch {
    // Manifest missing/invalid: no SCR counts as applied (fail safe = blocked).
    return new Set();
  }
}

/** A blocker is satisfied if: an applied SCR, or a board task that is Done. */
function isBlockerDone(id, byId, appliedScrs) {
  if (id.startsWith('SCR-')) return appliedScrs.has(id);
  return byId.get(id)?.status === 'Done';
}

function isBuildable(task, byId, appliedScrs) {
  if (!BUILDABLE_FROM.has(task.status)) {
    return false;
  }
  // SCR-* blockers resolve against the applied-SCRs manifest; other ids must be
  // a Done board task. Any unknown non-SCR id counts as NOT Done (gate held).
  return (task.blockedBy ?? []).every((id) =>
    isBlockerDone(id, byId, appliedScrs),
  );
}

function nextTask(board, lane) {
  const byId = new Map(board.tasks.map((task) => [task.id, task]));
  const appliedScrs = readAppliedScrs();
  const candidates = board.tasks
    .filter((task) => isBuildable(task, byId, appliedScrs))
    .filter((task) => !lane || task.owner === lane || task.owner === 'Either')
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.id.localeCompare(b.id));

  return candidates[0] ?? null;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function syncBoardMd(board) {
  const header = '| Task | Title | Status | Owner | Priority |';
  const lines = readFileSync(BOARD_MD, 'utf8').split('\n');
  const headerIndex = lines.findIndex((line) => line.trim() === header);
  if (headerIndex === -1) {
    return;
  }

  let end = headerIndex + 2;
  while (end < lines.length && lines[end].trim().startsWith(`| ${ID_PREFIX}`)) {
    end += 1;
  }

  const rows = board.tasks.map(
    (task) => `| ${task.id} | ${task.title} | ${task.status} | ${task.owner} | ${task.priority} |`,
  );
  lines.splice(headerIndex + 2, end - (headerIndex + 2), ...rows);

  const updatedIndex = lines.findIndex((line) => line.startsWith('Updated:'));
  if (updatedIndex !== -1) {
    lines[updatedIndex] = `Updated: ${board.updated}`;
  }

  writeFileSync(BOARD_MD, lines.join('\n'));
}

function syncTaskMd(task, status) {
  const file = path.join(ROOT, task.path);
  const text = readFileSync(file, 'utf8');
  const updated = text.replace(/^Status:.*$/m, `Status: ${status}`);
  if (updated !== text) {
    writeFileSync(file, updated);
  }
}

function setStatus(id, status) {
  if (!COLUMNS.includes(status)) {
    console.error(`Unknown column "${status}". Use one of: ${COLUMNS.join(', ')}`);
    process.exit(1);
  }

  const board = readBoard();
  const task = board.tasks.find((entry) => entry.id === id);
  if (!task) {
    console.error(`Unknown task "${id}".`);
    process.exit(1);
  }

  task.status = status;
  board.updated = formatLocalDate(new Date());
  writeFileSync(BOARD_JSON, `${JSON.stringify(board, null, 2)}\n`);
  syncBoardMd(board);
  syncTaskMd(task, status);
  console.log(`${id} -> ${status}`);
}

function list() {
  const board = readBoard();
  const byId = new Map(board.tasks.map((task) => [task.id, task]));
  const appliedScrs = readAppliedScrs();
  for (const task of board.tasks) {
    const flag = isBuildable(task, byId, appliedScrs) ? 'BUILDABLE' : '         ';
    const blocked = (task.blockedBy ?? []).join(',') || '-';
    console.log(
      `${flag}  ${task.id}  ${task.priority}  ${String(task.owner).padEnd(6)}  ${task.status.padEnd(11)}  blockedBy=${blocked}  ${task.title}`,
    );
  }
}

function gitBranchExists(branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', branch], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function laneFromArgs(rest) {
  const i = rest.indexOf('--lane');
  return i !== -1 ? rest.slice(i + 1).join(' ').trim() : null;
}

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case 'next': {
    const lane = laneFromArgs(rest);
    const task = nextTask(readBoard(), lane);
    if (!task) {
      console.log('NONE');
      break;
    }
    const branch = `task/${task.id}`;
    console.log(
      JSON.stringify(
        {
          id: task.id,
          title: task.title,
          priority: task.priority,
          owner: task.owner,
          path: task.path,
          branch,
          branchExists: gitBranchExists(branch),
        },
        null,
        2,
      ),
    );
    break;
  }
  case 'list':
    list();
    break;
  case 'set-status':
    setStatus(rest[0], rest.slice(1).join(' '));
    break;
  default:
    console.log('Usage: agent-board.mjs <next [--lane "Dev A"] | list | set-status <id> <column>>');
    process.exit(command ? 1 : 0);
}
