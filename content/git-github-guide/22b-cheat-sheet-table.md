### Set up

| Task | Command | What it does |
| --- | --- | --- |
| Check Git is installed | `git --version` | Prints your Git version |
| Set your name | `git config --global user.name "Your Name"` | Name stored in your commits |
| Set your email | `git config --global user.email "you@example.com"` | Email stored in your commits |
| New projects use main | `git config --global init.defaultBranch main` | Default branch name for `git init` |
| See your settings | `git config --global --list` | Lists name, email and other settings |

### Start a project

| Task | Command | What it does |
| --- | --- | --- |
| Start Git in this folder | `git init` | Creates the hidden `.git` history folder |
| Copy a project from GitHub | `git clone <REPOSITORY-URL>` | Downloads the project and its history |

### Everyday work

| Task | Command | What it does |
| --- | --- | --- |
| What is going on? | `git status` | Shows changed, staged and new files |
| Short status | `git status --short` | One line per file |
| See unstaged changes | `git diff` | Line-by-line changes not yet staged |
| See staged changes | `git diff --staged` | What the next commit will contain |
| Stage one file | `git add <file>` | Picks a file for the next commit |
| Stage everything (check first) | `git add .` | Picks every change in the folder |
| Save a commit | `git commit -m "<MESSAGE>"` | Saves staged changes with a message |
| History | `git log --oneline` | One line per commit |
| History as a graph | `git log --oneline --graph --all` | Shows branches and merges |

### Branches

| Task | Command | What it does |
| --- | --- | --- |
| List branches | `git branch` | Your local branches; `*` marks the current one |
| List all, including GitHub's | `git branch -a` | Adds remote branches |
| Create and switch | `git switch -c <BRANCH-NAME>` | New branch from where you are |
| Switch | `git switch <BRANCH-NAME>` | Moves to another branch |
| Older way to switch | `git checkout <BRANCH-NAME>` | Same as `git switch`, seen in older guides |
| Rename | `git branch -m <OLD-NAME> <NEW-NAME>` | Renames a local branch |
| Delete a merged branch | `git branch -d <BRANCH-NAME>` | Refuses if it has unmerged work |
| Merge into current branch | `git merge <BRANCH-NAME>` | Brings that branch's commits in |
| Stop a merge | `git merge --abort` | Back to before the merge |

### GitHub and remotes

| Task | Command | What it does |
| --- | --- | --- |
| Connect to GitHub | `git remote add origin <REPOSITORY-URL>` | Saves the address as origin |
| Show remotes | `git remote -v` | Lists remote addresses |
| Fix the address | `git remote set-url origin <REPOSITORY-URL>` | Changes origin's address |
| First push | `git push -u origin main` | Uploads and links main to GitHub |
| Push | `git push` | Uploads new commits |
| Push a new branch | `git push -u origin <BRANCH-NAME>` | Uploads the branch to GitHub |
| Check for new commits | `git fetch origin` | Downloads without changing your files |
| Pull, no surprises | `git pull --ff-only origin main` | Updates only if no merge is needed |
| Pull and merge | `git pull --no-rebase origin main` | Updates and merges if both sides changed |

### Undo and fix

| Task | Command | What it does |
| --- | --- | --- |
| Unstage, keep edits | `git restore --staged <file>` | Takes a file out of the next commit |
| Discard edits (careful) | `git restore <file>` | **Edits are lost for good** |
| Fix last commit (not pushed) | `git commit --amend` | Rewrites the last commit |
| Undo commit, keep staged | `git reset --soft HEAD~1` | Removes last commit, changes stay staged |
| Undo commit, keep edits | `git reset HEAD~1` | Removes last commit, changes stay as edits |
| Undo commit, delete changes | `git reset --hard HEAD~1` | **Destructive** |
| Undo a pushed commit | `git revert <COMMIT-HASH>` | Adds a commit that reverses it |
| Find lost commits | `git reflog` | Where your branch has been |
| Stop tracking a file | `git rm --cached <file>` | Keeps the file, Git forgets it |
| Why is it ignored? | `git check-ignore -v <file>` | Shows the matching .gitignore rule |

### Put work aside and tag releases

| Task | Command | What it does |
| --- | --- | --- |
| Put edits aside | `git stash push -m "<NOTE>"` | Saves unfinished work, cleans the folder |
| Include new files | `git stash push -u -m "<NOTE>"` | Also stashes untracked files |
| List stashes | `git stash list` | Shows saved stashes |
| Bring work back | `git stash pop` | Re-applies the latest stash and removes it |
| Tag a release | `git tag -a v1.0.0 -m "<NOTE>"` | Labels the current commit |
| List tags | `git tag --list` | Shows all tags |
| Push a tag | `git push origin v1.0.0` | Tags are not pushed automatically |
