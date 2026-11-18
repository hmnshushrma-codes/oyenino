Find what happened, then follow the steps. Run `git status` first every time.

**1. I edited a file and want the old version back (not committed yet)**

- Check what you will lose: `git diff <file>`
- Throw the edits away: `git restore <file>`

**2. I staged the wrong file**

- `git restore --staged <file>`. Your edits stay.

**3. I made a typo in my last commit message (not pushed)**

- `git commit --amend -m "Correct message"`

**4. I forgot a file in my last commit (not pushed)**

- `git add <file>`
- `git commit --amend --no-edit`

**5. I committed to `main` but meant to use a new branch (not pushed)**

- Make the branch where you are: `git switch -c <new-branch>`
- Go back to main: `git switch main`
- Remove the commit from main only: `git reset --hard HEAD~1` (your commit is safe on the new branch)

**6. My last commit was a mistake (not pushed)**

- Keep the changes to fix them: `git reset HEAD~1`
- Or throw them away completely: `git reset --hard HEAD~1`

**7. A commit on GitHub broke something**

- `git revert <COMMIT-HASH>`, then `git push`. Do not reset or force-push a shared branch.

**8. I pushed a password, API key or token**

- **First, change it:** revoke or rotate the key on the service it belongs to (GitHub, AWS, Stripe and so on). Assume it is already copied.
- Then stop tracking the file: add it to `.gitignore`, run `git rm --cached <file>` and commit.
- The old value is still in the history. Removing it needs history rewriting; follow GitHub's guide [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

**9. I deleted a file by mistake**

- Not committed yet: `git restore <file>`
- Deleted in a commit: `git log --oneline -- <file>` shows the commit that deleted it. Then `git restore --source=<COMMIT-HASH>~1 <file>` brings the file back. Finish with `git add <file>` and `git commit`.

**10. A merge is a mess and I want to stop**

- `git merge --abort` puts everything back to before the merge.

**11. A pull or rebase stopped with conflicts**

- Open each file `git status` lists, keep the right text, remove the `<<<<<<<`, `=======` and `>>>>>>>` lines.
- `git add <file>`, then `git commit` (for a merge) or `git rebase --continue` (for a rebase).
- To give up instead: `git merge --abort` or `git rebase --abort`.

**12. My push was rejected**

- Someone pushed first. `git pull --no-rebase origin <branch>`, fix any conflicts, then `git push`.
- Do not use `git push --force` on a shared branch.

**13. I reset and lost commits**

- `git reflog`, find the commit, then `git reset --hard <COMMIT-HASH>`.

**14. "You are in 'detached HEAD' state"**

- You are looking at an old commit, not a branch. Nothing is wrong.
- Made commits you want to keep? `git switch -c rescue/my-work`
- Just looking? `git switch main`

**15. Not sure what will happen?**

- Stop. Copy the project folder somewhere safe, then try the command on the copy.
