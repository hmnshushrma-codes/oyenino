# Beginner guide

No jargon. About 10 minutes to read.

## What a home server is, and what it can do

A home server is a small computer that stays on at home and does jobs for you. It can be a Raspberry Pi (a computer about the size of a phone), a mini PC, or an old laptop.

Here is a simple way to see it. Online services like Google Photos or Netflix are like renting a flat: easy, but you pay every month and the landlord sets the rules. A home server is like owning a small room in your own house. You pay for the room once, and you look after it yourself.

What people run on one:

| Job | Popular free app | What it does for you |
| --- | --- | --- |
| Photo backup | Immich | Backs up your phone photos automatically, like Google Photos |
| Ad blocking for the whole house | Pi-hole | Blocks ads on phones, TVs and laptops on your Wi-Fi |
| Your own video library | Jellyfin | A Netflix-style app for your own videos and family movies |
| Password manager | Vaultwarden | Keeps your passwords in one place that you control |
| File storage and sharing | Nextcloud | Your own Drive for documents and files |

All of these apps are free software. Check each app's website for the hardware it needs, because some, like photo apps, need more memory than others.

You may like a home server if:

- Your phone or cloud storage is always full and you do not want another monthly plan.
- You care about where your photos and documents are stored.
- You enjoy learning how things work.

You probably do not need one if:

- You want something that never needs your attention. A server needs updates and backups.
- You are happy with your current plans and have no wish to learn.

Is it free? The software is free. The hardware costs money once, and electricity costs a little. I have not put prices here because they change. Compare using your own electricity bill and your own storage plans.

## Your first week

One small task a day. The times are rough guesses. If you get stuck, stretch the week. Nothing here has a deadline. The P numbers point to prompts in the AI prompt library tab.

| Day | Task | Time | You are done when | Prompt |
| --- | --- | --- | --- | --- |
| 1 | Write down what you want the server to do. Pick three goals. | 30 min | You have a list of three goals | P1, P4 |
| 2 | Choose your hardware. Use something you already own first, such as an old laptop. | 30 min | You have picked one machine | P2 |
| 3 | Decide where it sits at home and how it connects. A network cable is more reliable than Wi-Fi. | 45 min | You know the spot and the cable or Wi-Fi plan | P6 |
| 4 | Install the operating system, the software that runs the machine. | 1 hour | The machine starts and you can log in | P6, P7 |
| 5 | Install Docker, a tool that runs apps in tidy boxes. | 1 hour | A welcome message from the test app appears | P6, P7 |
| 6 | Install one app only. Pi-hole or Jellyfin are good first choices. | 1 hour | You can open the app in the browser on your phone | P3, P9 |
| 7 | Set up a backup and store your passwords safely. | 30 min | A copy of your important files exists on a second drive | P14 |

The most common mistake is installing five apps on day one. Install one, use it for a few days, then add the next.

## What can go wrong, and how to stay safe

A home server is fun, but you are the one in charge. These are the problems that matter most.

- **A server is not a backup.** If the drive dies and you have no second copy, the files are gone. Keep a copy on another drive. A good rule: 3 copies, on 2 different drives, with 1 copy away from home.
- **Do not open your server to the whole internet.** Keep it on your home network. If you want to reach it when you are away, ask the AI about a private-network tool such as Tailscale (prompt P15) instead of changing router settings you do not understand.
- **Use strong, different passwords.** A password manager makes this easy.
- **Never paste secrets into an AI chat.** Passwords, keys and tokens stay with you. Replace them with XXXX before you paste anything.
- **Updates need attention.** Set a calendar reminder once a month to update your server.
- **Power cuts happen.** Shut the machine down properly instead of pulling the plug, because sudden power loss can damage files.
- **It takes time.** The real cost is your evenings, not only money.

If a command looks scary, stop. Paste it into your AI chat and ask what it does before you run it (prompt P13).
