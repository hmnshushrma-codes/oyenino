Let us make a real project and save it with Git, one step at a time. Type the commands into your terminal (Git Bash on Windows).

> **Note:** We ran every command in this guide with Git 2.54 in a practice project and copied the output. Your commit IDs, dates and folder paths will be different. Long folder paths are shortened to `.../`. For the GitHub steps, a local copy stood in for GitHub, so lines that show a GitHub address show the address it would have.

### 1. Make a folder and look inside it

```bash
mkdir my-first-app
cd my-first-app
git status
```

```output
fatal: not a git repository (or any of the parent directories): .git
```

That error is expected. The folder exists, but Git is not watching it yet.

### 2. Turn the folder into a Git repository

```bash
git init
```

```output
Initialized empty Git repository in .../my-first-app/.git/
```

`git init` creates the hidden `.git` folder where the history will live. It only works on your computer; it does **not** create anything on GitHub.

```bash
git status
```

```output
On branch main

No commits yet

nothing to commit (create/copy files and use "git add" to track)
```

### 3. Create a file

```bash
printf '# My First App\n' > README.md
git status
```

```output
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md

nothing added to commit but untracked files present (use "git add" to track)
```

**Untracked** means Git sees a new file but is not saving it yet.

### 4. Stage it, then commit it

```bash
git add README.md
git status
```

```output
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   README.md
```

The file is now in the staging area. Save it as the first commit:

```bash
git commit -m "Add README with the project name"
```

```output
[main (root-commit) 252df3a] Add README with the project name
 1 file changed, 1 insertion(+)
 create mode 100644 README.md
```

`252df3a` is the short ID (hash) of this commit. `root-commit` means it is the very first one.

### 5. Look at the history

```bash
git log
```

```output
commit 252df3a40f878431ff9d6f64592418a5f8acd65e
Author: Rahul Sharma <rahul@example.com>
Date:   Thu Nov 19 10:00:00 2026 +0530

    Add README with the project name
```

For a short, one-line view:

```bash
git log --oneline
```

```output
252df3a Add README with the project name
```

> **Tip:** If `git log` fills the screen and you cannot type, you are in a viewer. Press `q` to leave it.

### 6. Change something and see the difference

Add a line to `README.md` and create a new file called `index.html` (any text editor works). Then:

```bash
git status
```

```output
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	index.html

no changes added to commit (use "git add" and/or "git commit -a")
```

`git diff` shows exactly what changed in files Git already tracks. Lines starting with `+` were added, lines starting with `-` were removed:

```bash
git diff
```

```output
diff --git a/README.md b/README.md
index 8cc16da..973500c 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,3 @@
 # My First App
+
+A tiny web page to practise Git.
```

Stage the README and check what is about to be committed with `--staged`:

```bash
git add README.md
git diff --staged
git status --short
```

```output
M  README.md
?? index.html
```

In the short view, `M` means modified and staged, `??` means untracked. (`git diff --staged` printed the same change as above.) Stage the new file too and commit both:

```bash
git add index.html
git commit -m "Add home page and describe the project"
git log --oneline
```

```output
[main fb4fae0] Add home page and describe the project
 2 files changed, 3 insertions(+)
 create mode 100644 index.html
fb4fae0 Add home page and describe the project
252df3a Add README with the project name
```

### The four states of a file

| State | What it means | How it gets there |
| --- | --- | --- |
| **Untracked** | A new file Git is not saving yet | You create a file |
| **Modified** | A saved file that changed since the last commit | You edit a file |
| **Staged** | Picked for the next commit | `git add` |
| **Committed** | Saved in the history | `git commit` |

> **Warning:** `git add .` stages **everything** in the folder, including files you may not want to share, such as passwords in a `.env` file or large log files. Run `git status` first and add files by name until you are comfortable. The [.gitignore and secrets](#gitignore) section shows how to make Git ignore files for good.
