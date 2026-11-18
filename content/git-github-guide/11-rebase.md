**Rebase** is another way to bring a branch up to date. Instead of joining two lines with a merge commit, it lifts your branch's commits off and replays them on top of the latest `main`, as if you had started your work today. The result is a straight line of history.

You can be productive with Git for years using only merge. Learn rebase when a team asks for it, and follow the one rule below.

### Rebase a branch onto main

Your branch `feature/about` has two commits. Meanwhile `main` got a new one:

```output
* 5cf6b23 Add phone number to README
| * f26b5f2 Add founding year to about page
| * 757504a Add about page
|/  
*   1f4c75f Merge branch 'feature/title'
```

```bash
git switch feature/about
git rebase main
```

```output
Successfully rebased and updated refs/heads/feature/about.
```

```bash
git log --oneline --graph -3
```

```output
* 9b2f4ba Add founding year to about page
* 48bde00 Add about page
* 5cf6b23 Add phone number to README
```

Your two commits now sit on top of `main`, in a straight line. Look closely: their IDs changed (`757504a` became `48bde00`). Rebase does not move commits, it makes **new copies** of them.

### The golden rule

> **Warning:** Do not rebase commits that you have already pushed to a branch other people use. Because rebase makes new commits, your history no longer matches theirs, and the only way to push it is `--force`, which can wipe their work. Rebasing your own local commits, or your own feature branch that nobody else uses, is fine.

If you must update a branch you already pushed and you are sure nobody else uses it, use `git push --force-with-lease` rather than `--force`. It refuses to overwrite commits on GitHub that you have not seen yet.

### Conflicts during a rebase

Conflicts work like they do in a merge, but you may see one per commit being replayed:

```output
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
error: could not apply 9f7c8a7... Shorten phone line
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
```

1. Fix the file and remove the markers.
2. `git add README.md`
3. `git rebase --continue`

```output
Successfully rebased and updated refs/heads/feature/about.
```

Lost? `git rebase --abort` returns your branch to how it was before the rebase.

### Squash: tidy many small commits into one

Before opening a pull request you may have commits like "fix typo" and "fix another typo". **Squashing** combines them into one clean commit.

**Option 1: squash when merging.** Merge a whole branch as a single commit:

```bash
git merge --squash feature/menu
git commit -m "Add menu"
```

```output
Squash commit -- not updating HEAD
 menu.txt | 3 +++
 1 file changed, 3 insertions(+)
 create mode 100644 menu.txt
[main 3e5a722] Add menu
 1 file changed, 3 insertions(+)
 create mode 100644 menu.txt
```

The three commits from `feature/menu` arrive on `main` as one commit called "Add menu". GitHub's **Squash and merge** button on a pull request does the same thing.

**Option 2: interactive rebase.** To clean up your own branch before pushing it:

```bash
git rebase -i HEAD~3
```

Git opens an editor with your last three commits, oldest first, followed by help lines that start with `#`:

```output
pick b0c1214 # Shorten phone line
pick c54fd7f # fix typo
pick 1ef99fc # fix another typo
```

Change `pick` to `fixup` on the lines you want folded into the commit above them, then save and close:

```text
pick b0c1214 # Shorten phone line
fixup c54fd7f # fix typo
fixup 1ef99fc # fix another typo
```

```output
Successfully rebased and updated refs/heads/feature/about.
```

The three commits are now one. Use `squash` instead of `fixup` if you also want to edit the combined message. The golden rule applies here too: only for commits you have not shared.

### Merge or rebase?

| | Merge | Rebase |
| --- | --- | --- |
| History | Shows exactly what happened, with merge commits | One straight line, easier to read |
| Changes existing commits? | No | Yes, makes new copies |
| Safe on shared branches? | Yes | No, only on your own commits |
| Best for | Beginners, and bringing work into `main` | Tidying your own branch before a pull request |
