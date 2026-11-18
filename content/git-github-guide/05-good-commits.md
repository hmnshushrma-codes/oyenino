A commit message is a note to your future self and your teammates. In six months, `git log` is how you will find out why something changed.

### Keep commits small

One commit should do **one thing**: fix one bug, add one section, rename one file. Small commits are easy to understand, easy to review and easy to undo. If your message needs the word "and" twice, it is probably two commits.

### How to write the message

- **First line:** a short summary, about 50 characters, that finishes the sentence "This commit will...". For example: `Add contact form to home page`.
- **Then, if needed:** a blank line and a few lines explaining **why**. The code already shows what changed; the message should say why.

To write a longer message, run `git commit` without `-m`. Git opens a text editor; write the summary, a blank line, then the details, save and close.

```text
Fix total price on the cart page

The total ignored the delivery charge when the cart had
only one item. Add the charge in every case.
```

### Bad and good examples

| Bad | Better | Why |
| --- | --- | --- |
| `update` | `Update phone number on contact page` | Says what changed |
| `fixed stuff` | `Fix crash when the email field is empty` | Says which problem |
| `asdf` | `Add first draft of the About section` | Readable months later |
| `final changes!!!` | `Shorten home page title for mobile` | Nothing is ever final |
| `login, footer, colours, typo` | Four separate commits | One commit, one change |

> **Tip:** Some teams start messages with a type, such as `feat: add signup`, `fix: handle empty cart` or `docs: explain install`. This style is called Conventional Commits. It is optional; follow whatever your team uses.
