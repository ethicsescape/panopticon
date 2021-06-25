# Panopticon Escape Room

Panopticon is a virtual escape room about the ethics of surveillance technology.

Play online for free at [bit.ly/panopticongame](https://bit.ly/panopticongame).

Split up into teams of 2-4 players and create a leaderboard if you have multiple teams.

- [Setup Project](#setup-project)
- [Run Locally](#run-locally)
- [Other Common Commands](#other-common-commands)
- [Contributors](#contributors)
- [License](#license)

## Setup Project

- Install Node dependencies. Please use Node version 12 or higher.

```bash
npm install
```

- Create a `.env` file in the project root directory and ask Vinesh for the credentials.
- Ask Vinesh for the `manage.js` script, which is also not included in the repository.

## Run Locally

You will need two terminal windows, one for the backend and one for the frontend.

**Terminal 1: Backend**

```bash
heroku local web
```

**Terminal 2: Frontend**

```bash
jekyll serve
```

Follow the displayed link, usually [localhost:4000](http://localhost:4000).

## Other Common Commands

### Rebuild Clues and Hints

After editing `clues.json`, run this command:

```bash
node build.js
```

### Download Game Records

```bash
node manage.js download_games
```

### Compute Game Metrics

```bash
node manage.js compute_metrics
```

### Get Game Data as CSV/SQL

See [sql/data.md](sql/data.md) for instructions.

## Contributors

This virtual escape room was designed by Maria Gargiulo and Vinesh Kannan. Thank you to our friends from Coding It Forward for inspiration, playtesting, and feedback. We dedicate the game to our late friend Courtney Brousseau and to all the people working towards technological justice.

If you have any questions, contact Vinesh Kannan (vingkan [at] gmail [dot] com).

## License

This repository is released under the MIT License.
