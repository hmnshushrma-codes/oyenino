Reading is not enough; Git clicks when your hands have done it. This mission uses only commands from this guide and takes about 30 minutes.

### Your mission

1. Create a folder called `git-practice`, run `git init`, and check `git status`.
2. Create `README.md` with one line about yourself. Stage it and commit: `Add README`.
3. Create an empty repository on GitHub (no README) and push your project with `git push -u origin main`.
4. Make a branch `feature/hobbies`. Add a file `hobbies.md` with three hobbies. Commit and push the branch.
5. On GitHub, open a pull request from `feature/hobbies` into `main`. Read the **Files changed** tab, then merge it.
6. Back in your terminal: `git switch main`, `git pull`, and delete the local branch.
7. Make a conflict on purpose. On a new branch change the first line of `README.md` and commit. Switch to `main`, change the same line differently and commit. Merge the branch, fix the conflict, and commit.
8. Make a commit with a typo in the message, then fix it with `git commit --amend`.
9. Make a commit, push it, then undo it safely with `git revert`. Push again.
10. Run `git log --oneline --graph` and explain each line to yourself.

If you finish all ten, you know more Git than many people who use it every day.

### Knowledge check

Answer in your head, then check below.

1. You ran `git commit`. Can your teammate see the commit on GitHub?
2. What is the difference between `git fetch` and `git pull`?
3. You want to contribute to a project you cannot push to. What do you do first?
4. Which is safe for a commit already pushed to a shared branch: `git reset` or `git revert`?
5. Your push is rejected with "fetch first". What happened and what do you do?
6. What does `git restore --staged <file>` do to your edits?
7. You need to switch branch but your work is half done. Name two options.
8. Where do the conflict markers come from, and what must you do with them?

### Answers

1. No. A commit is saved only on your computer until you `git push`.
2. `fetch` downloads new commits but does not change your files or branch. `pull` fetches and then merges them into your current branch.
3. Fork it on GitHub, then clone your fork, make a branch, push, and open a pull request.
4. `git revert`. It adds a new commit that undoes the old one, so nobody's history changes.
5. Someone pushed commits you do not have. Run `git pull`, fix any conflicts, then push.
6. Nothing. It only takes the file out of the next commit; your edits stay in the file.
7. Commit the work on its branch, or `git stash` it and `git stash pop` later.
8. Git writes them when both sides changed the same lines. Keep the right text, delete all the marker lines, then `git add` and commit.
