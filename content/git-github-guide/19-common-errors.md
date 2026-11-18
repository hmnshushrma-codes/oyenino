Git's messages look scary but they almost always say what to do next. Read the whole message, including the `hint:` lines. Below are the ones beginners meet most, with the exact text Git prints.

### fatal: not a git repository

```output
fatal: not a git repository (or any of the parent directories): .git
```

**Meaning:** you are not inside a Git project folder. **Fix:** `cd` into your project folder, or run `git init` if this folder should become one.

### pathspec did not match any files

```output
fatal: pathspec 'nosuchfile.txt' did not match any files
```

**Meaning:** the file name is wrong, or you are in a different folder. **Fix:** run `ls` and `git status` and copy the exact name. Names are case-sensitive on many systems.

### nothing to commit, working tree clean

```output
On branch main
nothing to commit, working tree clean
```

**Meaning:** not an error. Either nothing changed, or you saved the file in a different folder. If you expected changes, check that your editor saved the file and that you are in the right project.

### src refspec main does not match any

```output
error: src refspec main does not match any
error: failed to push some refs to 'https://github.com/rahul-example/my-first-app.git'
```

**Meaning:** you tried to push a branch that does not exist yet. Usually you have not made a first commit, or your branch is called `master`. **Fix:** check with `git branch` and `git log`. Make a commit first, or push the branch name you actually have.

### Push rejected

```output
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/rahul-example/my-first-app.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.
```

You may also see `(fetch first)` instead of `(non-fast-forward)`. **Meaning:** GitHub has commits you do not. **Fix:** `git pull --no-rebase origin main`, fix any conflicts, then push again. Do not use `--force` on a shared branch. Full walkthrough in [Clone, fetch, pull and push](#remotes).

### You have divergent branches

```output
hint: You have divergent branches and need to specify how to reconcile them.
fatal: Need to specify how to reconcile divergent branches.
```

**Meaning:** both you and GitHub have new commits, and Git wants you to choose how to combine them. **Fix:** `git pull --no-rebase` to merge (simplest), or `git pull --rebase`. To stop the question for good: `git config --global pull.rebase false`.

### refusing to merge unrelated histories

```output
fatal: refusing to merge unrelated histories
```

**Meaning:** the two sides share no common commit. This usually happens when you created a repository on GitHub **with** a README, and also ran `git init` and committed locally. **Fix:** if you are sure both belong together, `git pull --no-rebase --allow-unrelated-histories origin main`, then push. Next time, create the GitHub repository empty.

### Your local changes would be overwritten

```output
error: Your local changes to the following files would be overwritten by checkout:
	README.md
Please commit your changes or stash them before you switch branches.
Aborting
```

**Meaning:** switching branch would destroy your unsaved edits, so Git stopped. **Fix:** commit them, or `git stash`, switch, and `git stash pop` later. See [Stash](#stash).

### CONFLICT (content): Merge conflict

```output
CONFLICT (content): Merge conflict in index.html
Automatic merge failed; fix conflicts and then commit the result.
```

**Meaning:** both sides changed the same lines. **Fix:** see [Merging and merge conflicts](#merging). To back out: `git merge --abort`.

### The branch is not fully merged

```output
error: the branch 'experiment' is not fully merged
```

**Meaning:** deleting this branch would lose commits that exist nowhere else. **Fix:** merge it first, or, if you really want to throw it away, `git branch -D experiment`.

### You are in 'detached HEAD' state

```output
Note: switching to 'HEAD~1'.

You are in 'detached HEAD' state. You can look around, make experimental
```

**Meaning:** you are looking at an old commit instead of a branch. **Fix:** to go back, `git switch main`. If you made commits here that you want to keep, first save them on a branch: `git switch -c <BRANCH-NAME>`.

### error: remote origin already exists

```output
error: remote origin already exists.
```

**Meaning:** this project is already connected to an address. **Fix:** check it with `git remote -v`, and change it with `git remote set-url origin <REPOSITORY-URL>`.

### Permission denied (publickey)

```output
Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Meaning:** you are using an SSH address, and GitHub did not accept a key from your computer. **Fix:** test with `ssh -T git@github.com`. Check `ssh-add -l` lists a key, and that the matching `.pub` key is added on GitHub under **Settings**, then **SSH and GPG keys**. Do not use `sudo` with Git. See [Install and set up Git](#setup).

### HTTPS asks for a password, then fails

**Meaning:** GitHub no longer accepts your account password for Git over HTTPS. **Fix:** sign in with Git Credential Manager or `gh auth login`, or paste a personal access token when Git asks for the password. See [Install and set up Git](#setup).

### Repository not found

```output
remote: Repository not found.
fatal: repository 'https://github.com/rahul-example/my-frist-app.git/' not found
```

**Meaning:** the address has a typo (here `frist`), the repository was renamed, or it is private and you are not signed in as someone with access. GitHub says "not found" for private repositories too, so it does not reveal that they exist. **Fix:** copy the address again from the green **Code** button on GitHub, then `git remote set-url origin <REPOSITORY-URL>`. If it is private, check you are signed in with the right account.
