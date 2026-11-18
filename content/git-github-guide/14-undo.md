Almost every mistake in Git can be fixed. The trick is to pick the right command, because some of them throw work away. Read this table before you try anything.

| Situation | Command | Risk |
| --- | --- | --- |
| See what is going on | `git status`, `git diff` | None, read only |
| Took a file out of the next commit, keep the edits | `git restore --staged <file>` | Low |
| Throw away unsaved edits to one file | `git restore <file>` | **Edits are gone for good** |
| Fix the last commit's message or add a forgotten file (not pushed yet) | `git commit --amend` | Changes the commit ID |
| Undo the last commit, keep the changes staged | `git reset --soft HEAD~1` | Rewrites local history |
| Undo the last commit, keep the changes as edits | `git reset HEAD~1` | Rewrites local history |
| Undo the last commit **and** throw the changes away | `git reset --hard HEAD~1` | **Destructive** |
| Undo a commit that is already on GitHub | `git revert <COMMIT-HASH>` | Safe, adds a new commit |
| Find a commit you "lost" | `git reflog` | None, read only |

`HEAD~1` means "one commit before where I am now".

### Unstage a file, keep your edits

You ran `git add` on a file by mistake, for example a `.env` file with a password:

```bash
git status --short
```

```output
A  .env
```

```bash
git restore --staged .env
git status --short
```

```output
?? .env
```

The file is out of the staging area and untracked again. Your file is untouched.

### Throw away edits to one file

```bash
git status --short
```

```output
 M index.html
```

```bash
git restore index.html
git status --short
```

Nothing is printed: `index.html` is back to how it was in the last commit.

> **Warning:** `git restore <file>` cannot be undone. The edits were never committed, so Git has no copy of them. If you might want them later, commit them or use `git stash` first.

### Fix the last commit

Spotted a typo right after committing?

```bash
git log --oneline -1
```

```output
84b577e Updte README
```

```bash
git commit --amend -m "Update README"
```

```output
[main f714afb] Update README
 Date: Thu Nov 19 12:00:00 2026 +0530
 1 file changed, 1 insertion(+)
```

To add a forgotten file to the same commit, `git add` it first, then run `git commit --amend --no-edit`. Notice the ID changed from `84b577e` to `f714afb`: amend makes a **new** commit. Only amend commits you have not pushed yet.

### Undo the last commit with reset

`git reset` moves your branch back to an earlier commit. The three modes differ in what happens to the changes from the commits you undo:

| Mode | The commit | Its changes |
| --- | --- | --- |
| `--soft` | Undone | Kept, still staged |
| (default, called mixed) | Undone | Kept as edits, not staged |
| `--hard` | Undone | **Thrown away** |

```bash
git reset --soft HEAD~1
git status --short
```

```output
A  a.txt
```

```bash
git reset HEAD~1
git status --short
```

```output
?? a.txt
```

> **Warning:** `git reset --hard` deletes uncommitted work and moves your branch. Never use it as a general "fix everything" button. And do not reset commits you have already pushed to a shared branch; use `git revert` instead.

### Undo a commit that is already on GitHub: revert

`git revert` does not delete anything. It adds a **new** commit that does the opposite of the old one, so everyone's history stays the same and you can push normally:

```bash
git revert --no-edit HEAD
```

```output
[main 9a06eeb] Revert "Add a.txt"
 Date: Thu Nov 19 12:00:00 2026 +0530
 1 file changed, 1 deletion(-)
 delete mode 100644 a.txt
```

Use the hash of any commit instead of `HEAD` to revert an older one. Without `--no-edit`, Git opens an editor so you can write why you reverted.

### The safety net: reflog

Git keeps a private diary of where your branch has pointed, called the **reflog**. It can rescue commits after a bad reset. Here a `reset --hard` removed the "Add price list" commit:

```bash
git log --oneline
```

```output
8e19b6a Start the shop project
```

```bash
git reflog
```

```output
8e19b6a HEAD@{0}: reset: moving to HEAD~1
234e2fa HEAD@{1}: commit: Add price list
8e19b6a HEAD@{2}: commit (initial): Start the shop project
```

The lost commit is `234e2fa`. Go back to it:

```bash
git reset --hard 234e2fa
```

```output
HEAD is now at 234e2fa Add price list
```

> **Note:** The reflog only lives on your computer and old entries expire after a while. It can bring back **commits**. It cannot bring back edits that were never committed.

### I messed up, what now?

A step-by-step list that starts from what went wrong and gives you the safest fix: committed to the wrong branch, pushed a password, deleted a file, a merge went bad, and more.
