A **remote** is another copy of your repository, usually on GitHub. These four commands move commits between your computer and a remote.

| Command | What it does | Changes your files? |
| --- | --- | --- |
| `git clone` | Downloads a whole repository, with its history, into a new folder | Creates a new folder |
| `git fetch` | Downloads new commits from the remote, but does not touch your work | No |
| `git pull` | Fetches, then adds those commits to your current branch | Usually yes |
| `git push` | Uploads your new commits to the remote | No |

### Clone: get a copy of a project

```bash
git clone https://github.com/rahul-example/my-first-app.git
```

```output
Cloning into 'my-first-app'...
done.
```

From GitHub you will also see a few progress lines, such as `Receiving objects: 100%`. The new folder already has the remote set up as `origin`:

```bash
cd my-first-app
git branch -a
```

```output
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
```

`remotes/origin/main` is Git's memory of what `main` looked like on GitHub the last time you checked.

### Fetch: see what is new, safely

Say a teammate pushed a commit. `git fetch` downloads it without changing your files:

```bash
git fetch origin
```

```output
From https://github.com/rahul-example/my-first-app
   fb4fae0..32ff193  main       -> origin/main
```

```bash
git status
```

```output
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)

nothing to commit, working tree clean
```

See which commits are waiting:

```bash
git log --oneline HEAD..origin/main
```

```output
32ff193 Add footer line to home page
```

### Pull: bring the new commits into your branch

```bash
git pull --ff-only origin main
```

```output
From https://github.com/rahul-example/my-first-app
 * branch            main       -> FETCH_HEAD
Updating fb4fae0..32ff193
Fast-forward
 index.html | 1 +
 1 file changed, 1 insertion(+)
```

**Fast-forward** means you had no new commits of your own, so Git simply moved your branch forward. `--ff-only` tells Git to do only that, and to stop rather than mix histories if both sides have new commits.

> **Real-life analogy:** `fetch` is checking your letterbox and reading the post. `pull` is reading it and also filing it into your folder.

### When you and a teammate both made commits

This happens all the time in a team. You made a commit, and so did your teammate, on the same branch. Your push is refused:

```bash
git push origin main
```

```output
To https://github.com/rahul-example/my-first-app.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/rahul-example/my-first-app.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Git is protecting your teammate's work. If you now run a plain `git pull`, recent Git versions stop and ask how to combine the two histories:

```output
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
hint:
hint: You can replace "git config" with "git config --global" to set a default
hint: preference for all repositories. You can also pass --rebase, --no-rebase,
hint: or --ff-only on the command line to override the configured default per
hint: invocation.
fatal: Need to specify how to reconcile divergent branches.
```

Nothing is broken. You have three choices:

- **Merge** (`--no-rebase`): keeps both sets of commits and joins them with a merge commit. The simplest choice when you are starting out.
- **Rebase** (`--rebase`): replays your commits on top of your teammate's, for a straight line of history. Useful later; skip it for now.
- **Fast-forward only** (`--ff-only`): refuses to combine anything. Useful as a safety setting, but in this situation it stops.

To merge:

```bash
git pull --no-rebase origin main
```

```output
From https://github.com/rahul-example/my-first-app
 * branch            main       -> FETCH_HEAD
Merge made by the 'ort' strategy.
 README.md | 2 ++
 1 file changed, 2 insertions(+)
```

```bash
git log --oneline --graph
```

```output
*   64de4bd Merge branch 'main' of https://github.com/rahul-example/my-first-app
|\  
| * 193a734 Explain how to open the page
* | 4a7c1af Add page title
|/  
* 32ff193 Add footer line to home page
* fb4fae0 Add home page and describe the project
* 252df3a Add README with the project name
```

Both commits are kept. Now the push works:

```bash
git push origin main
```

```output
To https://github.com/rahul-example/my-first-app.git
   193a734..64de4bd  main -> main
```

If both of you changed the **same lines**, Git cannot decide which version to keep and reports a **merge conflict**. It marks both versions inside the file; you keep the right text, delete the markers, then `git add` the file and `git commit`. Read both versions carefully before you delete anything.

> **Tip:** To make merging the default for every `git pull`, run `git config --global pull.rebase false` once. If you would rather decide each time, leave it unset and Git will keep asking.

> **Warning:** You may read online that `git push --force` fixes a rejected push. It does "fix" it by **deleting your teammate's commits** from GitHub. Do not use it on a shared branch.
