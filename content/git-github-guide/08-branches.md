A **branch** is a separate line of work inside one repository. You make a branch, try something on it, and `main` stays exactly as it was. If the idea works, you merge it in. If it does not, you delete the branch and nothing is harmed.

> **Real-life analogy:** Think of a photocopy of your notes. You scribble, cross out and rewrite on the copy. The original stays clean. When you are happy with the copy, you write the good parts back into the original.

{{diagram:branches}}

### Create a branch and switch to it

```bash
git switch -c feature/contact-page
```

```output
Switched to a new branch 'feature/contact-page'
```

`-c` means "create". Now commit as usual; the commit belongs to the new branch:

```bash
git add contact.html
git commit -m "Add contact page"
```

```output
[feature/contact-page 6c836dd] Add contact page
 1 file changed, 1 insertion(+)
 create mode 100644 contact.html
```

### Switching changes the files you see

When you switch branch, Git changes the files in your folder to match that branch:

```bash
git switch main
ls
```

```output
Switched to branch 'main'
index.html
README.md
```

```bash
git switch feature/contact-page
ls
```

```output
Switched to branch 'feature/contact-page'
contact.html
index.html
README.md
```

`contact.html` exists only on the feature branch. It is not lost when you go back to `main`; it is waiting on its own branch.

> **Tip:** Commit or stash your work before switching. If you have unsaved edits that would clash with the other branch, Git refuses to switch and tells you why (see [Stash](#stash)).

### See your branches

```bash
git branch
```

```output
* feature/contact-page
  main
```

The `*` marks the branch you are on. `git branch -a` also lists the branches Git knows about on GitHub.

### switch or checkout?

Older guides use `git checkout <BRANCH-NAME>` to switch and `git checkout -b <BRANCH-NAME>` to create. They still work:

```bash
git checkout -b feature/old-style
```

```output
Switched to a new branch 'feature/old-style'
```

`git checkout` does many unrelated jobs (it can also restore files), so Git added the clearer `git switch` for branches and `git restore` for files. This guide uses the newer commands.

### Rename and delete

You cannot delete the branch you are on, so switch away first:

```bash
git switch main
git branch -m feature/login feature/sign-in
git branch -d feature/sign-in
```

```output
Deleted branch feature/sign-in (was 0060c4e).
```

`-d` deletes only a branch whose work is already merged. If it is not, Git stops you:

```output
error: the branch 'feature/contact-page' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D feature/contact-page'
hint: Disable this message with "git config set advice.forceDeleteBranch false"
```

That is a safety check. Use capital `-D` only when you really want to throw that work away.

### Put a branch on GitHub

```bash
git push -u origin feature/contact-page
```

`-u` links the local branch to the one on GitHub, so later you can just type `git push`. After it is merged, you can delete the GitHub copy with `git push origin --delete <BRANCH-NAME>`.

### Naming branches

- Short, lowercase, words joined with `-`: `feature/contact-page`, `fix/cart-total`, `docs/install-steps`.
- No spaces. `git switch -c "bad name"` fails with `fatal: 'bad name' is not a valid branch name`.
- Many teams start with the type of work (`feature/`, `fix/`, `docs/`). Follow your team's habit.

> **Note:** **main or master?** They are just names. Older repositories often call the first branch `master`; newer ones, and GitHub's default for new repositories, use `main`. Commands work the same; type whichever name your repository uses.
