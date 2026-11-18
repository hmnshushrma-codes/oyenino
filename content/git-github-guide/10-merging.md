**Merging** brings the commits from one branch into another. You always merge **into the branch you are on**, so first switch to the branch that should receive the work, usually `main`.

```bash
git switch main
git merge feature/contact-page
```

Git does one of two things, depending on what happened on `main` meanwhile.

{{diagram:merge-types}}

### Fast-forward: main had no new commits

```output
Updating c164b68..6c836dd
Fast-forward
 contact.html | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 contact.html
```

Nothing to combine, so Git just moves `main` forward to the branch's last commit. The history stays a straight line.

### Merge commit: both branches have new commits

```bash
git merge --no-edit feature/footer
```

```output
Merge made by the 'ort' strategy.
 index.html | 1 +
 1 file changed, 1 insertion(+)
```

`ort` is just the name of the method Git uses to combine changes. `--no-edit` accepts the default message; without it Git opens an editor so you can write one.

```bash
git log --oneline --graph -5
```

```output
*   db64d72 Merge branch 'feature/footer'
|\  
| * 7dc019c Add footer
* | c56a80c Add opening hours to README
|/  
* 6c836dd Add contact page
* c164b68 Add prices section
```

When the branch is merged, delete it: `git branch -d feature/footer`.

### Merge conflicts

A **conflict** happens when both branches changed the **same lines** of the same file. Git cannot know which version you want, so it asks you. It is normal, not an error in your project.

Here `main` changed the page title to "The Corner Shop" while the branch changed it to "Oye Nino Shop":

```bash
git merge feature/title
```

```output
Auto-merging index.html
CONFLICT (content): Merge conflict in index.html
Automatic merge failed; fix conflicts and then commit the result.
```

```bash
git status
```

```output
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   index.html

no changes added to commit (use "git add" and/or "git commit -a")
```

Open the file. Git has written **both** versions into it, between markers:

```output
<<<<<<< HEAD
<h1>The Corner Shop</h1>
=======
<h1>Oye Nino Shop</h1>
>>>>>>> feature/title
<p>Prices</p>
<footer>Made in India</footer>
```

- Between `<<<<<<< HEAD` and `=======` is the version on your current branch (`main`).
- Between `=======` and `>>>>>>> feature/title` is the version from the branch you are merging.

### Fix it in four steps

1. Edit the file so it says what it should. Keep one version, the other, or a mix.
2. **Delete all three marker lines** (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Mark the file as fixed: `git add index.html`
4. Finish the merge: `git commit --no-edit`

```output
[main 1f4c75f] Merge branch 'feature/title'
```

> **Tip:** Code editors such as VS Code highlight conflicts and offer buttons like "Accept Current Change" and "Accept Incoming Change". They do the same four steps for you. Read both versions before you click.

> **Warning:** If a merge goes wrong or you feel lost, run `git merge --abort`. It puts everything back exactly as it was before you typed `git merge`. Then try again calmly.

### Fewer conflicts

- Pull `main` into your branch often, so differences stay small.
- Keep branches short-lived and focused on one change.
- Talk to your team before two people rework the same file.
