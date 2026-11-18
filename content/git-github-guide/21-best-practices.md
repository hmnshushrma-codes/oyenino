### Habits that save you

- **Run `git status` constantly.** Before you add, before you commit, before you switch, when anything feels odd.
- **Commit small and often.** One change per commit, with a message that says what and why. Small commits are easy to review and easy to undo.
- **Pull before you start work** each day, and push when you stop. Small, frequent syncs mean small conflicts.
- **One branch per change.** Keep `main` working. Delete branches after merging.
- **Read the diff before committing.** `git diff --staged` catches debug code, stray files and passwords.
- **Use pull requests**, even alone. Reading your own changes on GitHub the next morning catches mistakes.
- **Set up `.gitignore` on day one**, before the first `git add .`.

### Common mistakes

| Mistake | Why it hurts | Do this instead |
| --- | --- | --- |
| Committing `.env`, passwords or API keys | Anyone with access to the history can read them, forever | `.gitignore` them; if leaked, change the key first |
| `git add .` without looking | Junk, huge files and secrets end up in the history | `git status` first; add files by name |
| `git push --force` on a shared branch | Deletes teammates' commits on GitHub | `git pull`, then push; `--force-with-lease` only on your own branch |
| Rebasing commits others already have | Their history no longer matches yours | Rebase only your own unshared commits |
| Working on `main` for everything | One broken change blocks everyone | A branch for each change |
| Huge pull requests | Nobody can review 2,000 lines properly | Small pull requests, one topic each |
| `git reset --hard` to "fix" things | Deletes uncommitted work for good | Check the [Undo](#undo) table first |
| Committing `node_modules/` or build output | Bloats the repository, causes pointless conflicts | Ignore it; anyone can rebuild it |
| Messages like `update` or `fix` | History becomes useless | Say what changed: `Fix total when cart is empty` |
| Copying commands you do not understand | Some commands delete work | Read what it does; try it on a test copy |

> **Tip:** Git rarely loses committed work. When something goes wrong, stop, run `git status` and `git log --oneline`, and read the messages. Calm beats clever.
