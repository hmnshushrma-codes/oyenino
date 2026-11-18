### What is Git?

Git is a free program that keeps a history of every saved change in a project folder. Each saved version is called a commit. You can see what changed, when and by whom, and go back to an earlier version at any time. It works on your own computer, without the internet.

### What is the difference between Git and GitHub?

Git is the tool on your computer that records versions of your project. GitHub is a website that stores a copy of Git projects online, so you can back them up, share them and work with other people through pull requests and reviews. You can use Git without GitHub; GitLab and Bitbucket are similar websites.

### How do I push my code to GitHub?

Create an empty repository on GitHub and copy its address. In your project folder, run `git remote add origin <REPOSITORY-URL>` once, then `git push -u origin main`. After that, `git add`, `git commit` and `git push` send new work. A commit alone stays on your computer until you push.

### What is the difference between a branch and a fork?

A branch is a separate line of work inside one repository, used to build a feature without touching the main version. A fork is your own copy of someone else's repository on GitHub, used when you cannot push to the original, for example to contribute to an open source project. A fork can have many branches.

### What is a pull request?

A pull request is a page on GitHub where you ask to merge the changes from one branch into another. Teammates can read the changes, comment and approve before anything is merged. It is not the same as `git pull`, which downloads new commits to your computer.

### How do I undo a commit safely?

If the commit is already on GitHub, use `git revert <COMMIT-HASH>`. It adds a new commit that reverses the old one and is safe on shared branches. If you have not pushed yet, `git reset HEAD~1` removes the last commit and keeps your changes as edits. Avoid `git reset --hard` unless you are sure you want the changes gone.
