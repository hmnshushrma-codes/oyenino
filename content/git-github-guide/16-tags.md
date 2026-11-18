A **tag** is a permanent label on one commit, such as `v1.0.0`. Branches move forward with every commit; a tag stays where you put it. Teams tag the exact commit that was released, so they can always find it again.

### Create a tag

```bash
git tag -a v1.0.0 -m "First public version"
git tag
```

```output
v1.0.0
```

`-a` makes an **annotated** tag, which stores who made it, when, and a message. Without `-a` and `-m` you get a **lightweight** tag, just a name. Use annotated tags for releases.

```bash
git show v1.0.0 --stat
```

```output
tag v1.0.0
Tagger: Rahul Sharma <rahul@example.com>
Date:   Thu Nov 19 15:40:00 2026 +0530

First public version

commit 3e5a72298df68bf438b344dcba5c0e47e80e9893
Author: Rahul Sharma <rahul@example.com>
Date:   Thu Nov 19 15:40:00 2026 +0530

    Add menu

 menu.txt | 3 +++
 1 file changed, 3 insertions(+)
```

To tag an older commit, add its hash: `git tag -a v0.9.0 <COMMIT-HASH> -m "<NOTE>"`.

### Push tags to GitHub

`git push` does **not** send tags. Push them on purpose:

```bash
git push origin v1.0.0
```

```output
To https://github.com/rahul-example/recipes.git
 * [new tag]         v1.0.0 -> v1.0.0
```

`git push origin --tags` pushes every tag you have that GitHub does not.

### Delete a tag

```bash
git tag -d v1.0.1-light
```

```output
Deleted tag 'v1.0.1-light' (was 3e5a722)
```

That removes it only on your computer. For one already on GitHub, also run `git push origin --delete <TAG-NAME>`. Avoid moving or deleting a released tag; people may already depend on it.

### Version numbers

Most projects use **semantic versioning**, `MAJOR.MINOR.PATCH`:

- **PATCH** (`1.0.0` to `1.0.1`): bug fixes only.
- **MINOR** (`1.0.1` to `1.1.0`): new features that do not break anything.
- **MAJOR** (`1.1.0` to `2.0.0`): changes that break how people used the old version.

### Releases on GitHub

A GitHub **release** is built on a tag. It adds a title, release notes and downloadable files, and appears on the right side of the repository page. Open **Releases**, click **Draft a new release**, pick your tag, write what changed and publish.
