# AI prompt library

Copy a prompt, fill the [brackets], paste it into ChatGPT, Claude or any AI chat.

## How to use these prompts

1. **Fill every [bracket].** More detail gives a better answer.
2. **Go one step at a time.** Ask the AI to wait for you after each step.
3. **Paste what you really see**, not your own summary of it. Include the full error.
4. **Never paste passwords, keys or tokens.** Replace them with XXXX first.
5. **AI can be wrong or out of date.** For installing an app, paste the app's official instructions into the chat and ask the AI to work from those.
6. **Hinglish is fine.** Write the prompt in Hinglish and the AI will usually reply in Hinglish.

## Decide and plan

### P1: Do I need a home server?

```text
I am [your job or interest] and I am not very technical. I currently pay for [cloud storage, streaming or other services]. I care about [privacy, saving money, learning, or something else]. Ask me up to 5 short questions first, one at a time. Then tell me honestly if a home server is worth it for me, and what it would not solve. Use simple words and no jargon.
```

### P2: Choose my hardware

```text
I want a home server for [your goals]. My budget is about [amount in rupees]. I already own [list any old laptop, PC, Raspberry Pi or hard drives]. Compare 3 options, including using what I already own. For each one give the pros, cons, noise, power use and what could go wrong. Do not guess prices. Tell me what to check on current shopping sites.
```

### P3: Choose my first app

```text
My goals are [goal 1, goal 2, goal 3]. My machine is [model, RAM, storage]. Suggest the single best free app to install first and explain why. Then list two apps to add later. For each app tell me what hardware it needs and where to find its official install page. Warn me if my machine is too weak.
```

### P4: Make my 7-day plan

```text
I want to set up a home server on [your machine] to do [your goals]. I have about [30 to 60 minutes] a day and my skill level is [never used a terminal / some Linux / developer]. Make a 7-day plan. Each day needs one small task, how long it takes, and how I know it is done. Keep it realistic.
```

### P5: Estimate the running cost

```text
My server will use about [power in watts, or the model name] and run 24 hours a day. My electricity price is [rate per unit from your bill]. Show the calculation step by step so I can check it, then give the monthly and yearly cost. Ask me for the prices of the services I would stop paying for. Do not guess them.
```

## Build and fix

### P6: Guide me step by step

Works for any step in the Tech guide.

```text
Guide me through [the task, for example: installing Ubuntu Server on a Raspberry Pi 5 and logging in over SSH]. My computer is [Windows / Mac / Linux]. My skill level is [beginner / some experience]. Give me ONE step at a time. After each step, tell me what I should see if it worked, and wait for me to reply. If I paste an error, help me fix it before we move on.
```

### P7: Explain this error

```text
I ran this command: [paste the command]. I got this output: [paste the full output, with any passwords replaced by XXXX]. Explain in plain words what it means. Then give the safest fix first. If a fix could delete data or change security settings, say so clearly and ask me before suggesting it.
```

### P8: Fix my SSH connection

```text
I cannot connect to my server over SSH. My computer is [Windows / Mac / Linux]. The command I use is [the command, with the IP written as x.x.x.x]. The message I get is [paste it]. The server is a [Raspberry Pi / mini PC] on [Wi-Fi / network cable]. Give me a checklist of things to try, from most likely to least likely. Give me one at a time and tell me what each result means.
```

### P9: Write and explain a Docker Compose file

```text
I want to run [app name] with Docker Compose on [machine and operating system]. Here is the text from the app's official install page: [paste it]. Work only from that text. Write the compose.yml, explain each line in plain words, and tell me which parts I must change, such as ports, passwords and folders. Tell me where my data will be stored so I can back it up.
```

### P10: Review my setup for security

```text
Review this Docker Compose file for security and reliability mistakes. I have replaced all secrets with XXXX: [paste the file]. Check for exposed ports, default passwords, containers running as root, data that is not backed up, and missing restart settings. Rank the problems from most to least serious, and give the exact fix for each.
```

### P11: Schedule a job with cron

```text
Write a cron job that runs [the task, for example: copies my /srv/photos folder to my backup drive] every [day at 2 AM]. My system is [Ubuntu / Debian]. Show the exact crontab line, explain each field, add logging to a file, and tell me how to test it without waiting for the schedule. Do not use any command that deletes files without telling me first.
```

## Learn, stay safe and make content

### P12: Explain a word

```text
Explain [a word you do not understand, for example: Docker container] at 3 levels: like I am 12, like a smart adult who is not technical, and like an engineer. Use one everyday example for each level. Keep each level under 5 sentences.
```

### P13: Is this command safe?

Use this before you run anything you copied from the internet.

```text
Before I run this command on my server, explain what it does, line by line: [paste the command]. Tell me if it can delete files, change permissions, open the server to the internet, or download and run code from the internet. Say clearly whether it is safe to run, and what I should check first.
```

### P14: Make my backup plan

```text
Help me make a backup plan using the 3-2-1 rule: 3 copies, 2 different drives, 1 copy away from home. My important data is [photos, documents, videos, app data] and it is about [size] in total. I have [list your drives, cloud storage and other computers]. Give me a simple plan: what to copy, where to copy it, how often, and how to test a restore. Keep the first version as simple as possible. Do not use commands that delete data without warning me.
```

### P15: Check my security

```text
Here is how my home server is set up: [machine, operating system, apps, and how I connect to it from outside the house, if I do]. Act as a careful security reviewer. List the 5 most important risks for my setup, ranked by seriousness. For each one, explain it in plain words and give me the exact steps to fix it. Include safe ways to reach my server from outside my home without opening ports on my router.
```

### P16: Turn my build into content

For creators who share their build online.

```text
I am building [your project]. Here are my notes from today: [paste your notes]. Turn them into [a 45-second Instagram reel script / a carousel / a caption]. Start with a strong hook, be honest about what works and what does not, and end with a question that makes people comment. Write it in [English / Hinglish]. Mark which shots I should film.
```

Prompts are a starting point. Change the words until they fit you.
