from db.database import SessionLocal
from db.models import User, XPLog
from datetime import datetime

# ── XP rewards ───────────────────────────────────────────
XP_REWARDS = {
    "journal_entry":      50,
    "nightly_checkin":    30,
    "alter_ego_chat":     20,
    "streak_7_days":     200,
    "streak_30_days":    500,
    "dna_unlocked":      300,
    "future_letter":     150,
    "first_entry":       100,   # bonus for very first entry
}

# ── Level thresholds ──────────────────────────────────────
LEVELS = [
    (1,  "Newcomer",       0),
    (2,  "Observer",       500),
    (3,  "Reflector",      1200),
    (4,  "Pattern Seeker", 2000),
    (5,  "Self Aware",     3200),
    (6,  "Inner Guide",    5000),
    (7,  "Mind Architect", 8000),
    (8,  "Enlightened",    12000),
]

def get_level_info(xp: int) -> dict:
    current_level = LEVELS[0]
    next_level    = LEVELS[1] if len(LEVELS) > 1 else None

    for i, (lvl, name, threshold) in enumerate(LEVELS):
        if xp >= threshold:
            current_level = (lvl, name, threshold)
            next_level    = LEVELS[i + 1] if i + 1 < len(LEVELS) else None

    lvl_num, lvl_name, lvl_threshold = current_level

    if next_level:
        next_num, next_name, next_threshold = next_level
        xp_needed   = next_threshold - lvl_threshold
        xp_progress = xp - lvl_threshold
        progress_pct = round((xp_progress / xp_needed) * 100, 1)
        xp_to_next   = next_threshold - xp
    else:
        xp_needed    = 0
        xp_progress  = 0
        progress_pct = 100
        xp_to_next   = 0
        next_name    = None

    return {
        "level":        lvl_num,
        "level_name":   lvl_name,
        "xp":           xp,
        "xp_to_next":   xp_to_next,
        "progress_pct": progress_pct,
        "next_level":   next_name
    }

# ── Award XP ──────────────────────────────────────────────
def award_xp(user_id: int, action: str) -> dict:
    if user_id is None:
        return {"xp_earned": 0, "total_xp": 0}

    xp_earned = XP_REWARDS.get(action, 0)
    if xp_earned == 0:
        return {"xp_earned": 0, "total_xp": 0}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"xp_earned": 0, "total_xp": 0}

        # check for first entry bonus
        if action == "journal_entry":
            from db.models import JournalEntry
            count = db.query(JournalEntry).filter(
                JournalEntry.user_id == user_id
            ).count()
            if count == 1:
                xp_earned += XP_REWARDS["first_entry"]

        # check streak bonus
        streak = get_current_streak(user_id, db)
        if streak == 7:
            xp_earned += XP_REWARDS["streak_7_days"]
        elif streak == 30:
            xp_earned += XP_REWARDS["streak_30_days"]

        # update user XP
        user.xp    = (user.xp or 0) + xp_earned
        user.level = get_level_info(user.xp)["level"]

        # log the XP event
        log = XPLog(
            user_id   = user_id,
            action    = action,
            xp_earned = xp_earned,
            created_at = datetime.now()
        )
        db.add(log)
        db.commit()

        return {
            "xp_earned":  xp_earned,
            "total_xp":   user.xp,
            "level_info": get_level_info(user.xp)
        }

    except Exception as e:
        db.rollback()
        print(f"XP award failed: {e}")
        return {"xp_earned": 0, "total_xp": 0}
    finally:
        db.close()

# ── Get user stats ────────────────────────────────────────
def get_user_stats(user_id: int) -> dict:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        xp         = user.xp or 0
        level_info = get_level_info(xp)
        streak     = get_current_streak(user_id, db)

        # badge check
        from db.models import JournalEntry, NightlyCheckin, AlterEgoSession
        entry_count   = db.query(JournalEntry).filter(JournalEntry.user_id == user_id).count()
        checkin_count = db.query(NightlyCheckin).filter(NightlyCheckin.user_id == user_id).count()
        alter_count   = db.query(AlterEgoSession).filter(
            AlterEgoSession.user_id == user_id,
            AlterEgoSession.role    == "user"
        ).count()

        badges = build_badges(entry_count, checkin_count, alter_count, streak, xp)

        # last 28 days activity for streak calendar
        from datetime import timedelta
        from sqlalchemy import func as sqlfunc
        cutoff = datetime.now() - timedelta(days=28)
        active_days = db.query(
            sqlfunc.date(JournalEntry.created_at).label("day")
        ).filter(
            JournalEntry.user_id    == user_id,
            JournalEntry.created_at >= cutoff
        ).distinct().all()
        active_dates = [str(r.day) for r in active_days]

        return {
            "username":   user.username,
            "xp":         xp,
            "level_info": level_info,
            "streak":     streak,
            "badges":     badges,
            "active_dates": active_dates,
            "entry_count":  entry_count,
            "checkin_count": checkin_count
        }
    finally:
        db.close()

# ── Current streak ────────────────────────────────────────
def get_current_streak(user_id: int, db=None) -> int:
    close_after = db is None
    if db is None:
        db = SessionLocal()
    try:
        from db.models import JournalEntry
        from datetime import timedelta
        entries = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id)
            .order_by(JournalEntry.created_at.desc())
            .all()
        )
        if not entries:
            return 0

        streak   = 0
        check_date = datetime.now().date()

        for entry in entries:
            entry_date = entry.created_at.date()
            if entry_date == check_date or entry_date == check_date - timedelta(days=1):
                if entry_date < check_date:
                    check_date = entry_date
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        return streak
    finally:
        if close_after:
            db.close()

# ── Badge definitions ─────────────────────────────────────
def build_badges(entries, checkins, alter_chats, streak, xp) -> list:
    return [
        {
            "id":       "first_entry",
            "icon":     "✍️",
            "name":     "First words",
            "desc":     "Write your first entry",
            "unlocked": entries >= 1
        },
        {
            "id":       "week_warrior",
            "icon":     "🔥",
            "name":     "Week warrior",
            "desc":     "7 day streak",
            "unlocked": streak >= 7
        },
        {
            "id":       "self_aware",
            "icon":     "🧠",
            "name":     "Self aware",
            "desc":     "Write 50 entries",
            "unlocked": entries >= 50
        },
        {
            "id":       "night_ritual",
            "icon":     "🌙",
            "name":     "Moon ritual",
            "desc":     "30 nightly checkins",
            "unlocked": checkins >= 30
        },
        {
            "id":       "alter_ego",
            "icon":     "👁️",
            "name":     "Alter ego",
            "desc":     "10 alter ego chats",
            "unlocked": alter_chats >= 10
        },
        {
            "id":       "deep_diver",
            "icon":     "🔮",
            "name":     "Deep diver",
            "desc":     "Reach Level 5",
            "unlocked": xp >= 3200
        },
        {
            "id":       "month_warrior",
            "icon":     "⚡",
            "name":     "Month warrior",
            "desc":     "30 day streak",
            "unlocked": streak >= 30
        },
        {
            "id":       "enlightened",
            "icon":     "✨",
            "name":     "Enlightened",
            "desc":     "Reach Level 8",
            "unlocked": xp >= 12000
        },
    ]