These three words all mean "a copy", which is why they are confusing. The difference is **where** the copy lives and **why** you make it.

| | What it is | Where it lives | Use it when |
| --- | --- | --- | --- |
| **Branch** | A separate line of work inside one repository | Inside the same repository | You can push to the project and want to work without touching `main` |
| **Fork** | Your own copy of someone else's repository | On GitHub, under your account | You **cannot** push to the project, for example open source |
| **Clone** | A full copy of a repository, with history | On your computer | You want to work on any repository locally |

They work together. To contribute to someone else's project you **fork** it, **clone** your fork, make a **branch**, then open a **pull request**.

{{diagram:fork-flow}}

### Contribute to an open source project, step by step

Rahul wants to add a recipe to Priya's project `priya-example/recipes`. He cannot push to it, so he forks it.

**1. Fork it on GitHub.** On the project page, click **Fork** (top right), choose your account as the owner and click **Create fork**. You now have `your-username/recipes`.

**2. Clone your fork** (not the original):

```bash
git clone https://github.com/rahul-example/recipes.git
cd recipes
```

**3. Connect the original project** so you can fetch its updates. By convention it is called `upstream`:

```bash
git remote add upstream https://github.com/priya-example/recipes.git
git remote -v
```

```output
origin	https://github.com/rahul-example/recipes.git (fetch)
origin	https://github.com/rahul-example/recipes.git (push)
upstream	https://github.com/priya-example/recipes.git (fetch)
upstream	https://github.com/priya-example/recipes.git (push)
```

`origin` is your fork, which you can push to. `upstream` is the original, which you only fetch from.

**4. Make a branch and commit your change:**

```bash
git switch -c add-chai-recipe
git add chai.md
git commit -m "Add masala chai recipe"
```

**5. Push the branch to your fork:**

```bash
git push -u origin add-chai-recipe
```

```output
To https://github.com/rahul-example/recipes.git
 * [new branch]      add-chai-recipe -> add-chai-recipe
branch 'add-chai-recipe' set up to track 'origin/add-chai-recipe'.
```

**6. Open a pull request.** On GitHub, your fork shows a **Compare & pull request** button. The base repository is Priya's project and the head is your branch. See [Pull requests](#pull-requests).

### Keep your fork up to date

The original project keeps moving. Bring its new commits into your copy before starting new work.

**On GitHub:** open your fork, click **Sync fork** above the file list, then **Update branch**.

**On the command line:**

```bash
git switch main
git fetch upstream
git merge upstream/main
git push origin main
```

```output
From https://github.com/priya-example/recipes
 * [new branch]      main       -> upstream/main
Updating 1dcb874..78cb329
Fast-forward
 lassi.md | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 lassi.md
To https://github.com/rahul-example/recipes.git
   1dcb874..78cb329  main -> main
```

> **Tip:** Never commit directly to `main` in your fork. Keep it as a clean copy of the original, and do every change on its own branch. Syncing then never causes conflicts.
