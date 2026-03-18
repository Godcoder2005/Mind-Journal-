from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from db.database import SessionLocal
from db.models import User
from services.future_letter import generate_future_letter
import logging

logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.WARNING)

scheduler = BackgroundScheduler()

# ── Future Self Letter — 1st of every month at 9am ───────
def generate_letters_for_all_users():
    print("Running monthly letter generation...")
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            try:
                generate_future_letter(user.id)
                print(f"Letter generated for user {user.id}")
            except Exception as e:
                print(f"Letter failed for user {user.id}: {e}")
    finally:
        db.close()

# ── Checkin reminder — every day at 9pm ──────────────────
def send_checkin_reminders():
    print("Sending nightly checkin reminders...")
    # for now just logs — add email/push notification later
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Reminder: {len(users)} users should check in tonight")
    finally:
        db.close()

# ── Start scheduler ───────────────────────────────────────
def start_scheduler():
    # monthly letter — 1st of every month at 9am
    scheduler.add_job(
        generate_letters_for_all_users,
        trigger = CronTrigger(day=1, hour=9, minute=0),
        id      = "monthly_letters",
        replace_existing = True
    )

    # nightly reminder — every day at 9pm
    scheduler.add_job(
        send_checkin_reminders,
        trigger = CronTrigger(hour=21, minute=0),
        id      = "nightly_reminder",
        replace_existing = True
    )

    scheduler.start()
    print("✅ Scheduler started — monthly letters + nightly reminders active")

def stop_scheduler():
    scheduler.shutdown()