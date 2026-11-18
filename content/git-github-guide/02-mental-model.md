Most Git confusion goes away once you know that your work lives in four places, and that each command moves it from one place to the next.

{{diagram:four-places}}

- **Working directory:** your project folder, the files you open and edit. Git notices changes here but does not save them yet.
- **Staging area:** a waiting area for your next save. `git add` puts a change here. You choose exactly what goes into the next commit.
- **Local repository:** the saved history, kept in a hidden folder called `.git` inside your project. `git commit` saves everything in the staging area here as one new version.
- **Remote repository:** a copy of the project somewhere else, usually on GitHub. `git push` uploads your commits there; `git fetch` and `git pull` download other people's commits.

> **Real-life analogy:** Packing a parcel. Your room is the working directory. The box on the table is the staging area: you choose what goes in it. Sealing the box and writing the label is the commit. Handing it to the courier is the push.

### Two words you will see a lot

- **Commit:** one saved version of the project, with a message, an author, a date and a unique ID called a **hash** (for example `252df3a`).
- **HEAD:** Git's word for "where you are right now". Usually it points to the latest commit on the branch you are working on.

> **Tip:** The single most useful command is `git status`. It tells you which of these places your changes are in. Run it whenever you are unsure.
