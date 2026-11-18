A branching strategy is simply a team's agreement about which branches exist and how work flows between them. You do not need a complicated one. Here are the common ones, simplest first.

### GitHub flow (start here)

1. `main` always works and could be released at any time.
2. For every change, make a short-lived branch from `main`: `git switch -c fix/cart-total`.
3. Commit, push the branch, and open a pull request.
4. Someone reviews it. Fix what they find by pushing more commits to the same branch.
5. Merge the pull request into `main` and delete the branch.

That is all. It suits solo projects, small teams and most websites and apps.

### Trunk-based development

Everyone merges small changes into `main` (the "trunk") very often, at least daily. Branches live for hours, not weeks. Unfinished features are hidden behind switches in the code instead of living on long branches. It works well for experienced teams with good automated tests.

### Git Flow

A more formal model with two long-lived branches, `main` for released versions and `develop` for ongoing work, plus `feature/`, `release/` and `hotfix/` branches. It fits software shipped in numbered versions on a schedule, such as installed apps. For a website that goes live many times a week it is usually more ceremony than you need.

### Which should I use?

| Situation | Good choice |
| --- | --- |
| Learning, or a solo project | GitHub flow |
| Small team, website or web app | GitHub flow |
| Experienced team that deploys many times a day | Trunk-based |
| Versioned releases that need long support | Git Flow |

> **Tip:** Whatever you choose, the habits that matter most are the same: keep branches short-lived, keep `main` working, and merge through pull requests so someone else reads the change.
