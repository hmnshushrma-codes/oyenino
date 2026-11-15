# Tech guide

The path I took on a Raspberry Pi 5, with the commands and the mistakes. Works the same on most small Linux machines.

## Part 1: the build

Goal: a Raspberry Pi 5 that boots from an SSD, runs Ubuntu Server, and that you can log into from your laptop.

### Parts I used

- Raspberry Pi 5 with 8 GB of RAM
- The official 27 W power supply, which is the one recommended for the Pi 5
- A 128 GB 2.5 inch SATA SSD in a USB 3 adapter
- A microSD card, only as a spare for recovery
- A network cable and a laptop

The same steps work on a mini PC or an old laptop. Only the first install step changes.

### Step 1: put Ubuntu Server on the SSD

Use Raspberry Pi Imager (free, from raspberrypi.com). Choose Ubuntu Server, 64-bit, and the SSD as the target. If the Imager offers settings for your image, set a hostname, a username and password, turn on SSH, and set your time zone. Double-check you picked the SSD and not another drive, because this erases it.

### Step 2: boot from the SSD

Plug the SSD adapter into a blue USB 3 port, take the microSD card out, and power on. Wait 3 to 5 minutes on the first boot, because it sets itself up.

Why this works: the Pi 5 checks the SD card first, then NVMe, then USB. You can see its boot order with this command:

```sh
sudo rpi-eeprom-config | grep BOOT_ORDER
```

A result of `BOOT_ORDER=0xf461` is the common default. Read it from right to left: 1 is the SD card, 6 is NVMe, 4 is USB, and f means try again.

### Step 3: find the Pi and log in

Open your router's device list and find the Pi's IP address. Then, from your laptop:

```sh
ssh your-username@192.168.1.xx
```

Use the IP address, not `hostname.local`. The `.local` name often fails on home networks.

### Step 4: check you booted from the SSD

```sh
findmnt /
```

The source should be `/dev/sda2`, not `/dev/mmcblk0p2`. The first means the SSD, the second means the SD card.

### Step 5: update and set the clock

```sh
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

After the reboot, log in again and check the time zone:

```sh
timedatectl
```

If it is wrong, set it, for example `sudo timedatectl set-timezone Asia/Kolkata`.

## Part 2: Docker and your first services

Docker runs each app in its own sealed box, called a container. Adding or removing an app does not mess up the rest of the machine. Compose is a small text file that describes which containers you want.

### Step 6: install Docker

Use Docker's own install script. Do not use the snap version.

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

The second line lets your user run Docker without `sudo`. Log out and log back in so it applies. Note that being in the `docker` group is close to being an administrator, which is fine on your own home network.

### Step 7: test it

```sh
docker run --rm hello-world
docker compose version
systemctl is-enabled docker
```

You should see a "Hello from Docker!" message, a Compose version number, and the word `enabled`. Enabled means Docker starts by itself after every reboot.

### Step 8: run a tiny web server with Compose

Make a folder and a file named `compose.yml`:

```sh
mkdir -p ~/first-app && cd ~/first-app
nano compose.yml
```

Paste this, save, and close:

```yaml
services:
  hello:
    image: nginx:alpine
    ports:
      - "8080:80"
    restart: unless-stopped
```

Then start it:

```sh
docker compose up -d
```

Open `http://YOUR-PI-IP:8080` in a browser on your phone or laptop. A welcome page means your server works. The line `restart: unless-stopped` brings the app back after a reboot.

### Step 9: your first real app

Pick one app from the Beginner guide. Open its official install page, copy its Compose file, and ask the AI to explain it before you run it (prompt P9). Install steps change often, so always take the file from the app's own website and not from memory or from an old blog post.

### Commands you will use all the time

| Command | What it does |
| --- | --- |
| `docker ps` | Lists running containers |
| `docker compose logs -f` | Shows live messages from your apps. Press Ctrl+C to stop watching |
| `docker compose down` | Stops and removes the containers in this folder. Your saved data stays |
| `docker compose pull && docker compose up -d` | Updates the apps to their newest version |

## Part 3: backups, safety and the problems I hit

### Backups

Your server is not a backup. Follow the 3-2-1 rule: 3 copies of your data, on 2 different drives, with 1 copy away from home.

A simple start is to copy an important folder to a second drive:

```sh
rsync -a /path/to/important/ /path/to/backup-drive/important/
```

Run it by hand once, then schedule it with cron. Open the schedule with `crontab -e` and add this line to run it at 2 AM every day and keep a log:

```sh
0 2 * * * rsync -a /path/to/important/ /path/to/backup-drive/important/ >> $HOME/backup.log 2>&1
```

An untested backup is only a hope. Restore one file to a different folder and open it, at least once.

### Security basics

- Keep the server on your home network. Do not forward ports on your router unless you know exactly why.
- Update monthly: `sudo apt update && sudo apt full-upgrade -y`.
- Use SSH keys instead of a password when you are ready. Ask the AI with prompt P15.
- Docker can open ports in ways a simple firewall does not block. Ask the AI to check your setup (prompt P10).
- Use a different strong password for every app.

### Problems I actually hit

| What happened | What it meant | What fixed it |
| --- | --- | --- |
| The Pi booted, but `findmnt /` showed the SD card | I had flashed the SSD from the same image as the SD card, so both had identical names and IDs | Boot with only one of them plugged in, then check with `findmnt /` and `lsblk -f` |
| The SSD vanished for a second after I plugged it in | A loose or slow USB connection | Use a blue USB 3 port, reseat the cable, and check with `sudo dmesg \| tail -30` |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` when I used SSH | The reinstalled Pi had new security keys, so my laptop did not recognise it. This is a safety check, not an attack, but only when you did reinstall it | `ssh-keygen -R YOUR-PI-IP`, then connect again and accept the new key |
| `hostname.local` did not work | Local name lookup is unreliable on many home networks | Use the IP address from your router |
| Connection timed out right after boot | First boot is still setting up | Wait 3 to 5 minutes and try again |
| `unable to lock directory /var/lib/apt/lists` | Another update was already running | Wait a few minutes. Do not delete lock files while something is running |
| `target is busy` when unmounting a drive before flashing | A program was still using it | Close file managers and terminals, then `sudo umount`. Make sure you picked the right disk |

When you hit something new, copy the exact message and use prompt P7.
