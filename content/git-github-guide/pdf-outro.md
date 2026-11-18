### Branch, fork, clone, pull request

- **Branch:** a separate line of work inside one repository.
- **Fork:** your own copy of someone else's repository, on GitHub.
- **Clone:** a copy of a repository on your computer.
- **Pull request:** a page on GitHub asking to merge one branch into another, with review.

### Stay safe

- Run `git status` before and after anything you are unsure about.
- `git restore <file>` and `git reset --hard` throw work away. They are not routine fixes.
- Already pushed? Use `git revert`, not reset. Never `git push --force` on a shared branch.
- Pushed a password or key? Change it first, then clean up. `.gitignore` does not remove it from history.
