Some files should never go into Git: passwords, downloaded libraries, logs and build output. A file called `.gitignore` in the top folder of your project lists them, and Git then acts as if they are not there.

Before adding a `.gitignore`, Git offers to track everything:

```bash
git status --short
```

```output
?? .env
?? debug.log
?? node_modules/
```

Create a file named `.gitignore` with these lines:

```gitignore
node_modules/
.env
*.log
```

- `node_modules/` ignores a whole folder (downloaded JavaScript packages; anyone can reinstall them).
- `.env` ignores one file, the usual place for passwords and API keys.
- `*.log` ignores every file ending in `.log`.

```bash
git status --short
```

```output
?? .gitignore
```

The ignored files have gone from the list. Commit the `.gitignore` itself so everyone on the project uses the same rules. To check why a file is ignored:

```bash
git check-ignore -v .env
```

```output
.gitignore:2:.env	.env
```

That means: line 2 of `.gitignore` is the rule that hides `.env`.

> **Tip:** GitHub can add a ready-made `.gitignore` for your language when you create a repository, and it keeps a collection of templates at [github.com/github/gitignore](https://github.com/github/gitignore).

### A file was already committed

`.gitignore` only affects files Git is **not** tracking yet. If `.env` is already committed, adding it to `.gitignore` does nothing. Stop tracking it like this (the file stays on your computer):

```bash
git rm --cached .env
git commit -m "Stop tracking .env"
```

```output
rm '.env'
[main 9f19d16] Stop tracking .env
 1 file changed, 1 deletion(-)
 delete mode 100644 .env
```

### If you committed a secret

> **Warning:** If a password, API key or token was ever committed, and especially if it was pushed, treat it as leaked. **First** revoke or change it on the service it belongs to. Removing the file in a new commit does not remove it from the history; anyone can still find the old version. Cleaning history is a separate, careful job: follow GitHub's guide [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
