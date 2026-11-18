Something broke, and you want to know **what** changed, **when**, and **who** changed it. Git's history can answer all three. In this example, the cart's delivery charge has quietly become zero.

### Look through the history

```bash
git log --oneline
```

```output
3da18bf Add contact line
fee0355 Mention free delivery in README
cd5a2f6 Offer free delivery
46c962c Add README
d3b05f9 Set up project notes
52f17f0 Add cart total
```

Narrow it down:

| Command | Shows |
| --- | --- |
| `git log --oneline -- cart.js` | Only commits that changed `cart.js` |
| `git log --oneline --author="Priya"` | Only commits by one person |
| `git log --oneline --since="2026-11-14"` | Only commits after a date |
| `git log -p -1 -- cart.js` | The latest change to `cart.js`, with the exact lines |

### Search for when a line appeared: log -S

`-S` finds the commits that added or removed a piece of text:

```bash
git log --oneline -S "delivery = 0"
```

```output
cd5a2f6 Offer free delivery
```

### See what a commit changed: show

```bash
git show --stat cd5a2f6
```

```output
commit cd5a2f671cdf4b12bee09676f9b12daf92209909
Author: Priya Nair <priya@example.com>
Date:   Sat Nov 14 11:00:00 2026 +0530

    Offer free delivery

 cart.js | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Leave out `--stat` to see the changed lines themselves.

### Who last changed each line: blame

```bash
git blame cart.js
```

```output
^52f17f0 (Rahul Sharma 2026-11-11 11:00:00 +0530 1) const price = 100;
cd5a2f67 (Priya Nair   2026-11-14 11:00:00 +0530 2) const delivery = 0;
^52f17f0 (Rahul Sharma 2026-11-11 11:00:00 +0530 3) const total = price + delivery;
```

Each line shows the commit, the author and the date it last changed. (`^` marks the very first commit.) Despite the name, use it to find **context**, not someone to blame: open the commit and read why the change was made. On GitHub, open a file and click **Blame** for the same view.

### Find the commit that broke it: bisect

When you do not know where to look, `git bisect` finds the guilty commit by halving the history each step. You only answer "good" or "bad".

```bash
git bisect start
git bisect bad
git bisect good 52f17f0
```

`bad` means "the current commit is broken". `good 52f17f0` names a commit you know worked.

```output
status: waiting for both good and bad commits
status: waiting for good commit(s), bad commit known
Bisecting: 2 revisions left to test after this (roughly 1 step)
[46c962c9bee412bf58fbe1aa7c8e413ddb559a3d] Add README
```

Git has checked out a commit in the middle. Test it (here: is the delivery charge still 40?) and tell Git:

```bash
git bisect good
```

```output
Bisecting: 0 revisions left to test after this (roughly 1 step)
[fee0355479f25cf9f524ea88a2e8ee9e25476f76] Mention free delivery in README
```

Keep answering `git bisect good` or `git bisect bad`. In this example two more answers (`bad`, then `bad`) are enough:

```output
cd5a2f671cdf4b12bee09676f9b12daf92209909 is the first bad commit
commit cd5a2f671cdf4b12bee09676f9b12daf92209909
Author: Priya Nair <priya@example.com>
Date:   Sat Nov 14 11:00:00 2026 +0530

    Offer free delivery
```

Always finish with:

```bash
git bisect reset
```

That returns you to the branch you started on.

> **Tip:** If a command can test for the bug, Git can do all the answering for you: `git bisect run <COMMAND>`. Git treats exit code 0 as good and most other codes as bad. With 1,000 commits, bisect needs only about 10 steps.
