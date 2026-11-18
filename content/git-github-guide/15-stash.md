You are halfway through something when you need to switch branch, perhaps to fix an urgent bug. Your edits are not ready to commit, and Git will not let you switch:

```bash
git switch feature/about
```

```output
error: Your local changes to the following files would be overwritten by checkout:
	README.md
Please commit your changes or stash them before you switch branches.
Aborting
```

**Stash** puts your unfinished edits on a shelf and gives you a clean folder. Later you take them back.

> **Real-life analogy:** Sweeping the papers on your desk into a drawer so you can use the desk for something else, then pulling them back out exactly as they were.

### Put work aside and bring it back

```bash
git stash
```

```output
Saved working directory and index state WIP on main: 3e5a722 Add menu
```

```bash
git status --short
```

Nothing is printed: the folder is clean. Switch branch, fix the bug, commit, come back. Then:

```bash
git stash pop
```

```output
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (522e91e13a70dc27a112a099bcc9d1edb5584ca3)
```

Your edits are back, and the stash entry is removed.

### Give stashes a name

With more than one stash, plain "WIP" is hard to tell apart. Add a note:

```bash
git stash push -m "WIP: new welcome text"
git stash list
```

```output
Saved working directory and index state On main: WIP: new welcome text
stash@{0}: On main: WIP: new welcome text
```

### Useful stash commands

| Command | What it does |
| --- | --- |
| `git stash` | Stash changes to tracked files |
| `git stash push -u -m "<NOTE>"` | Also stash **new** (untracked) files, with a note |
| `git stash list` | Show all stashes; the newest is `stash@{0}` |
| `git stash pop` | Bring back the newest stash and remove it from the list |
| `git stash apply` | Bring back the newest stash but keep it in the list |
| `git stash drop` | Delete the newest stash |

> **Warning:** By default `git stash` leaves **new files** behind, because Git is not tracking them yet. Use `git stash push -u` to include them. And do not use stash as long-term storage: stashes are easy to forget and are never pushed to GitHub. For anything you want to keep, make a commit on a branch.

If popping a stash clashes with changes made since, you get a normal conflict. Fix it the same way as a merge conflict; the stash is kept until you drop it.
