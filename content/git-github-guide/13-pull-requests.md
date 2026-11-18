A **pull request** (PR) is a page on GitHub that says: "here are the changes on my branch, please review them and merge them into `main`." It shows every changed line, lets people comment, and keeps a record of why the change was made.

> **Note:** A pull request is not the same as `git pull`. `git pull` downloads commits to your computer. A pull request is a request on GitHub for someone to **merge** your work.

### Open a pull request

1. Push your branch: `git push -u origin <BRANCH-NAME>`.
2. On the repository page, GitHub shows a yellow banner with **Compare & pull request**. Click it. (Or open the **Pull requests** tab and click **New pull request**.)
3. Check the two branches at the top. **base** is where the changes should go, usually `main`. **compare** is your branch.
4. Write a clear title and description (see below).
5. Click **Create pull request**. Not ready yet? Use the arrow next to it and choose **Create draft pull request**.

With the GitHub CLI you can do the same from the terminal with `gh pr create`.

### Write a description people want to review

```text
Add contact page

What: a new contact.html with the shop's phone number and
opening hours, linked from the home page footer.

Why: customers kept asking for the phone number on Instagram.

How to test: open the home page, click Contact in the footer.

Closes #12
```

- Say **what** changed and **why**. Add screenshots for anything visual.
- Keep it small. A pull request that changes 50 lines gets a careful review; one that changes 2,000 gets a quick "looks fine".
- Writing `Closes #12` links the pull request to issue number 12. When the pull request is merged into the default branch, GitHub closes the issue automatically. `Fixes` and `Resolves` work too.

### Draft pull requests

A **draft** pull request shares unfinished work without asking for a formal review. It cannot be merged. When it is ready, click **Ready for review**. Drafts are great for "is this the right direction?" questions early on.

### Reviewing

Reviewers read the **Files changed** tab, comment on specific lines, and finish with one of three choices:

| Review | Means |
| --- | --- |
| **Comment** | General feedback, without approving or blocking |
| **Approve** | The changes are ready to merge |
| **Request changes** | Something must be fixed before merging |

To answer review comments, just commit to the **same branch** and push. The pull request updates itself; you do not open a new one.

> **Tip:** When you review, be specific and kind: "This breaks if the cart is empty; could we check for that?" beats "wrong". When you are reviewed, remember the comments are about the code, not about you.

### The three merge buttons

| Button | What happens | Pick it when |
| --- | --- | --- |
| **Create a merge commit** | Keeps every commit and adds a merge commit | You want the full history |
| **Squash and merge** | Combines all the pull request's commits into one | The branch has many small "fix typo" commits |
| **Rebase and merge** | Adds each commit on top of the base branch, no merge commit | You want a straight history and clean commits |

Not every repository shows all three; the owner can turn options off in the settings.

### After the merge

```bash
git switch main
git pull
git branch -d <BRANCH-NAME>
```

Bring the merged work into your local `main` and delete your local copy of the branch. GitHub offers a **Delete branch** button on the merged pull request for the GitHub copy.

> **Note:** After **Squash and merge** or **Rebase and merge**, `git branch -d` may say the branch "is not fully merged". That is because GitHub made new commits instead of reusing yours. If the pull request shows as merged on GitHub, it is safe to delete with `git branch -D <BRANCH-NAME>`.
