# Habitly

A web app that recommends activities based on how you're feeling: time available, physical energy, and social battery. It also tracks what you've done over the week.

## Stack

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Flask, SQLite (via SQLAlchemy)

## Running it

You need two terminals.

**Backend**
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Runs on `http://localhost:5000`.

**Frontend**
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Features

- Sign up / sign in with email and password
- Set your current physical energy, social battery, and time available
- Get activity recommendations tailored to your state and the current weather/time of day
- Log completed activities
- Track your week — activity volume by day, a balance radar chart, and a habit matrix
- Customise or add your own activities
