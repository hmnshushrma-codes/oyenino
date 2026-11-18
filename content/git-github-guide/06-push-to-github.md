So far everything is only on your computer. Now we put a copy on GitHub.

### 1. Create an empty repository on GitHub

1. On GitHub, click the **+** in the top-right corner and choose **New repository**.
2. Give it a name, for example `my-first-app`, and choose **Public** or **Private**.
3. **Do not** tick "Add a README", ".gitignore" or "license". Your project already has commits, and starting with an empty repository avoids a clash on the first push.
4. Click **Create repository**. GitHub shows the address of your new repository. Copy it.

### 2. Connect your project and push

```bash
git branch -M main
git remote add origin https://github.com/your-username/my-first-app.git
git remote -v
```

```output
origin	https://github.com/rahul-example/my-first-app.git (fetch)
origin	https://github.com/rahul-example/my-first-app.git (push)
```

- `git branch -M main` makes sure your branch is called `main`. If it already is, nothing changes.
- `git remote add origin <URL>` saves the GitHub address under the short name **origin**. "origin" is just the usual name for your main remote; it is not a special GitHub word.

Now upload your commits:

```bash
git push -u origin main
```

```output
To https://github.com/rahul-example/my-first-app.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

The first time, Git may ask you to log in (see [Logging in to GitHub](#setup-logging-in-to-github-from-the-terminal)). GitHub may also print a few extra lines starting with `Enumerating objects` or `remote:`; that is normal.

`-u` links your local `main` to `origin/main`. From now on, plain `git push` and `git pull` know where to go, and `git status` tells you if you are ahead or behind:

```bash
git status
```

```output
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Refresh the page on GitHub: your files and commits are there.

### If Git says "remote origin already exists"

```output
error: remote origin already exists.
```

You already connected this project to an address. Look at it with `git remote -v`. If it is wrong, change it instead of adding it again:

```bash
git remote set-url origin https://github.com/your-username/my-first-app.git
```

> **Warning:** Before your first push, check `git status` for files that must stay private: `.env` files, passwords, API keys, private keys. Once something is pushed to a public repository, assume someone has copied it. See [.gitignore and secrets](#gitignore).
