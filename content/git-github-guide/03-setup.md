### Install Git

- **Windows:** download Git for Windows from [git-scm.com/downloads](https://git-scm.com/downloads). It includes **Git Bash**, a terminal where every command in this guide works as written. Use Git Bash on Windows.
- **Mac:** open the Terminal app and type `git --version`. If Git is not installed, your Mac offers to install the Command Line Tools, which include Git. You can also run `xcode-select --install`.
- **Linux:** use your package manager. On Ubuntu or Debian: `sudo apt install git`.

Check that it worked. Your version number may be different; that is fine.

```bash
git --version
```

```output
git version 2.54.0 (Apple Git-157)
```

### Tell Git who you are

Every commit records a name and an email. Set them once on each computer:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

The third line makes new projects start with a branch called `main`. Older projects, and older tutorials, often use `master` instead. They work the same way; only the name is different.

Check your settings:

```bash
git config --global --list
```

```output
user.name=Rahul Sharma
user.email=rahul@example.com
init.defaultbranch=main
```

> **Note:** The email you set is stored inside every commit. On public projects anyone can see it. GitHub can give you a private no-reply address instead: on GitHub, open **Settings**, then **Emails**, and turn on **Keep my email addresses private**. Use the no-reply address it shows in `git config`.

### Logging in to GitHub from the terminal

You need this before your first push. There are two ways. Pick one.

**HTTPS (easiest to start).** Your project address looks like `https://github.com/you/project.git`. GitHub no longer accepts your account password for Git. Instead, use one of these:

- **Git Credential Manager:** comes with Git for Windows. It opens a browser window to sign in, then remembers you. On a Mac you can install it with Homebrew.
- **GitHub CLI:** install it, run `gh auth login`, choose HTTPS and say yes when it asks to log in Git with your GitHub account. It saves your login for Git.
- **Personal access token:** a long password-like code you create on GitHub. When Git asks for your password, paste the token.

**SSH (set up once, then no prompts).** Your project address looks like `git@github.com:you/project.git`. You create a pair of keys: a private key that stays on your computer and a public key you give to GitHub.

```bash
ssh-keygen -t ed25519 -C "you@example.com"
```

Press Enter to accept the default file, and choose a passphrase. Then show the **public** key (the file ending in `.pub`), copy it, and add it on GitHub under **Settings**, then **SSH and GPG keys**:

```bash
cat ~/.ssh/id_ed25519.pub
```

Test the connection:

```bash
ssh -T git@github.com
```

If it worked, GitHub replies with your username:

```output
Hi USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
```

"Does not provide shell access" is normal. It only means GitHub does not give you a command line on its servers.

> **Warning:** Never share your private key (the file **without** `.pub`) or a personal access token. Do not paste them into chats, screenshots or code. Anyone who has them can push to your projects. If one leaks, delete it on GitHub straight away and make a new one.
