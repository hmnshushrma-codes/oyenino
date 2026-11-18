GitHub is more than a place to store code. These are the features worth knowing first. Plans and settings change over time, so follow the links to GitHub Docs for the current details.

### README

A file called `README.md` in the top folder is shown on the repository's front page. Say what the project is, how to run it, and how to help. It is written in Markdown: `#` for headings, `-` for bullet points, backticks for code.

### Issues

Issues are GitHub's to-do list and bug tracker: "plan, discuss, and track work". Each issue has a number, such as `#12`. Writing `Closes #12` in a pull request description closes the issue when the pull request is merged into the default branch. [About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues)

### Pull requests and reviews

The heart of working together on GitHub. See [Pull requests and code review](#pull-requests).

### Protecting main

Under the repository's **Settings**, branch protection rules and rulesets let the owner protect important branches: for example require a pull request and an approving review before merging, or block force pushes and deletion. Which options you get depends on your plan and whether the repository is public. [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

### GitHub Actions

Actions run tasks automatically when something happens, for example run your tests on every pull request, or deploy when `main` changes. Each workflow is a YAML file in the `.github/workflows` folder of your repository. [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)

### GitHub Pages

Free hosting for static websites (HTML, CSS and JavaScript) straight from a repository. On the free plans, the repository must be public. Pages sites are public on the internet even when the repository is private. [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

### Releases

A release packages a tagged version with notes and files to download. See [Tags and releases](#tags).

### Secret scanning and push protection

GitHub can spot passwords, keys and tokens in code. Push protection for your personal account is on by default and stops you from pushing secrets to public repositories. Treat it as a safety net, not a plan: keep secrets out of Git with `.gitignore`. [About push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection)

### GitHub CLI

`gh` brings GitHub to your terminal. A few examples:

| Command | What it does |
| --- | --- |
| `gh auth login` | Sign in, and set up Git to use that sign-in |
| `gh repo create` | Create a GitHub repository |
| `gh repo fork` | Fork a repository |
| `gh pr create` | Open a pull request for the current branch |
| `gh pr list` | List open pull requests |

[GitHub CLI manual](https://cli.github.com/manual/)
