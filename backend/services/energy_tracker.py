from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import JournalEntry, EnergyForecast
from sqlalchemy import func
from datetime import datetime, timedelta
import statistics

# ─────────────────────────────────────────────
# LLM Setup
# ─────────────────────────────────────────────
llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.3)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# ─────────────────────────────────────────────
# Pydantic Output Schemas
# ─────────────────────────────────────────────
class EnergyDNAStructure(BaseModel):
    dna_type:       str   # e.g. "Night Warrior"
    dna_tagline:    str   # one punchy line
    time_pattern:   str   # morning_person | afternoon_peak | night_thinker
    weekly_rhythm:  str   # frontloaded | backloaded | midweek_peak | weekend_peak | flat
    dna_summary:    str   # 2-3 sentences
    superpower:     str   # what their pattern makes them good at
    blind_spot:     str   # what their pattern makes them vulnerable to

class ForecastStructure(BaseModel):
    predicted_energy: float   # 1.0 to 10.0
    confidence:       str     # high | medium | low
    weather_label:    str     # Stormy | Cloudy | Partly Sunny | Sunny | Radiant
    reasoning:        str     # why this prediction
    advice:           str     # how to prepare
    villain_warning:  str     # pattern warning — empty string if none

class VillainStructure(BaseModel):
    villain_name:    str    # e.g. "your manager"
    energy_impact:   float  # how many points it drops energy on average
    pattern_summary: str    # when and how it drains you
    advice:          str    # how to protect your energy

class StreakStructure(BaseModel):
    current_streak:     int
    longest_streak:     int
    streak_status:      str   # "on_streak" | "in_slump" | "recovering" | "neutral"
    streak_message:     str   # motivational message
    slump_alert:        bool  # true if in slump longer than usual

# ─────────────────────────────────────────────
# Core Data Fetcher — used by all 5 features
# ─────────────────────────────────────────────
def fetch_energy_data(user_id: int, days_back: int = 60) -> dict:
    db = SessionLocal()
    try:
        cutoff = datetime.now() - timedelta(days=days_back)

        # avg energy by day of week
        day_rows = (
            db.query(
                JournalEntry.day_of_week,
                func.avg(JournalEntry.energy_score).label("avg_energy"),
                func.count(JournalEntry.id).label("count")
            )
            .filter(JournalEntry.user_id == user_id, JournalEntry.created_at >= cutoff)
            .group_by(JournalEntry.day_of_week)
            .all()
        )

        # avg energy by hour of day
        hour_rows = (
            db.query(
                JournalEntry.hour_of_day,
                func.avg(JournalEntry.energy_score).label("avg_energy")
            )
            .filter(JournalEntry.user_id == user_id, JournalEntry.created_at >= cutoff)
            .group_by(JournalEntry.hour_of_day)
            .all()
        )

        # all entries ordered by date
        all_entries = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id, JournalEntry.created_at >= cutoff)
            .order_by(JournalEntry.created_at.asc())
            .all()
        )

        # last 7 days entries
        recent_entries = (
            db.query(JournalEntry)
            .filter(
                JournalEntry.user_id == user_id,
                JournalEntry.created_at >= datetime.now() - timedelta(days=7)
            )
            .order_by(JournalEntry.created_at.desc())
            .all()
        )

        # low energy themes — for villain detection
        low_energy_entries = (
            db.query(JournalEntry.themes, JournalEntry.content)
            .filter(
                JournalEntry.user_id == user_id,
                JournalEntry.energy_score <= 4,
                JournalEntry.created_at >= cutoff
            )
            .all()
        )

        # format day map
        day_map = {}
        for r in day_rows:
            day_map[DAYS[r.day_of_week]] = {
                "avg_energy": round(r.avg_energy, 1),
                "count":      r.count
            }

        # format hour map
        hour_map = {r.hour_of_day: round(r.avg_energy, 1) for r in hour_rows}

        # all energy scores for stats
        scores = [e.energy_score for e in all_entries if e.energy_score]

        # consistency — standard deviation
        if len(scores) >= 3:
            std_dev     = round(statistics.stdev(scores), 2)
            consistency = "stable" if std_dev < 1.5 else "moderate" if std_dev < 2.5 else "volatile"
        else:
            std_dev, consistency = None, "unknown"

        # peak and low day
        peak_day = max(day_map, key=lambda d: day_map[d]["avg_energy"]) if day_map else "unknown"
        low_day  = min(day_map, key=lambda d: day_map[d]["avg_energy"]) if day_map else "unknown"

        # peak hour
        peak_hour_num = max(hour_map, key=hour_map.get) if hour_map else None
        peak_hour     = f"{peak_hour_num}:00–{peak_hour_num+2}:00" if peak_hour_num else "unknown"

        # recovery speed
        recovery_speed = _calculate_recovery(scores, all_entries)

        # recent trend for weather forecast
        recent_trend = [
            {
                "day":    DAYS[e.day_of_week],
                "energy": e.energy_score,
                "mood":   e.mood,
                "themes": e.themes
            }
            for e in recent_entries
        ]

        # villain themes from low energy entries
        villain_themes = []
        for row in low_energy_entries:
            if row.themes:
                villain_themes.extend(row.themes.split(", "))
        villain_themes = list(set(t.strip() for t in villain_themes if t.strip()))

        return {
            "day_map":         day_map,
            "hour_map":        hour_map,
            "scores":          scores,
            "all_entries":     all_entries,
            "recent_trend":    recent_trend,
            "villain_themes":  villain_themes,
            "peak_day":        peak_day,
            "low_day":         low_day,
            "peak_hour":       peak_hour,
            "consistency":     consistency,
            "std_dev":         std_dev,
            "recovery_speed":  recovery_speed,
            "total_entries":   len(scores),
            "has_enough_data": len(scores) >= 10
        }
    finally:
        db.close()

def _calculate_recovery(scores: list, entries: list) -> str:
    if len(entries) < 5:
        return "unknown"
    avg = sum(scores) / len(scores)
    recovery_days = []
    for i in range(len(entries) - 1):
        current = entries[i].energy_score
        if current and current < avg - 1.5:
            for j in range(i + 1, min(i + 8, len(entries))):
                if entries[j].energy_score and entries[j].energy_score >= avg:
                    recovery_days.append(j - i)
                    break
    if not recovery_days:
        return "unknown"
    avg_recovery = sum(recovery_days) / len(recovery_days)
    if avg_recovery <= 1.5:   return "fast"
    elif avg_recovery <= 3:   return "medium"
    else:                     return "slow"

# ─────────────────────────────────────────────
# Feature 1 — Energy DNA
# ─────────────────────────────────────────────
def generate_energy_dna(user_id: int, stage: str = "mature_user") -> dict:
    # ── skip for insufficient data ────────────────────────
    if stage in ('anonymous', 'first_entry'):
        return {"ready": False, "message": "Not enough data yet"}
    # ── existing logic unchanged below ───────────────────
    data = fetch_energy_data(user_id)

    if not data["has_enough_data"]:
        return {
            "ready":    False,
            "message":  f"Write {10 - data['total_entries']} more entries to unlock your Energy DNA",
            "progress": data["total_entries"],
            "required": 10
        }

    structured_llm = llm.with_structured_output(EnergyDNAStructure)

    prompt = f"""
You are an expert in behavioral psychology and human energy patterns.

Here is this person's complete energy data from the last 60 days:

ENERGY BY DAY OF WEEK: {data['day_map']}
ENERGY BY HOUR OF DAY: {data['hour_map']}
PEAK DAY: {data['peak_day']}
LOWEST DAY: {data['low_day']}
PEAK HOUR WINDOW: {data['peak_hour']}
CONSISTENCY: {data['consistency']} (std dev: {data['std_dev']})
RECOVERY SPEED: {data['recovery_speed']}
TOTAL ENTRIES ANALYZED: {data['total_entries']}

Determine this person's Energy DNA type.

Rules:
- dna_type: creative 2-word name capturing their energy personality
  e.g. "Night Warrior", "Steady Climber", "Thursday Thunder", "Slow Burner"
  Make it feel like a superpower name not a clinical label
- dna_tagline: one punchy sentence capturing their energy identity
- time_pattern: "morning_person" | "afternoon_peak" | "night_thinker" | "inconsistent"
- weekly_rhythm: "frontloaded" | "backloaded" | "midweek_peak" | "weekend_peak" | "flat"
- dna_summary: 2-3 sentences that feel like reading your horoscope — specific, true, slightly surprising
- superpower: what this energy pattern makes them naturally excellent at
- blind_spot: what this pattern makes them consistently vulnerable to

STRICT RULES:
- Reference actual numbers and days from the data
- Speak directly to the person using "you"
- dna_type must feel unique and memorable
"""

    response = structured_llm.invoke(prompt)

    return {
        "ready":          True,
        "dna_type":       response.dna_type,
        "dna_tagline":    response.dna_tagline,
        "peak_day":       data["peak_day"],
        "low_day":        data["low_day"],
        "peak_hour":      data["peak_hour"],
        "consistency":    data["consistency"],
        "recovery_speed": data["recovery_speed"],
        "time_pattern":   response.time_pattern,
        "weekly_rhythm":  response.weekly_rhythm,
        "dna_summary":    response.dna_summary,
        "superpower":     response.superpower,
        "blind_spot":     response.blind_spot,
        "raw_data": {
            "day_map":  data["day_map"],
            "hour_map": data["hour_map"]
        }
    }

# ─────────────────────────────────────────────
# Feature 2 — Energy Weather Forecast
# ─────────────────────────────────────────────
def generate_energy_forecast(user_id: int, stage: str = "mature_user") -> dict:
    # ── skip for insufficient data ────────────────────────
    if stage in ('anonymous', 'first_entry'):
        return {"ready": False, "message": "Not enough data yet"}
    # ── existing logic unchanged below ───────────────────
    data = fetch_energy_data(user_id, days_back=30)

    if not data["has_enough_data"]:
        return {
            "ready":   False,
            "message": f"Write {10 - data['total_entries']} more entries to unlock your Energy Forecast"
        }

    structured_llm  = llm.with_structured_output(ForecastStructure)
    tomorrow        = datetime.now() + timedelta(days=1)
    tomorrow_name   = DAYS[tomorrow.weekday()]
    historical_avg  = data["day_map"].get(tomorrow_name, {}).get("avg_energy", "no data")

    prompt = f"""
You are an energy pattern analyst with deep expertise in behavioral psychology.

TOMORROW IS: {tomorrow_name}
HISTORICAL ENERGY BY DAY (last 30 days): {data['day_map']}
RECENT 7-DAY TREND: {data['recent_trend']}
THEMES ON LOW ENERGY DAYS: {data['villain_themes']}
HISTORICAL AVERAGE FOR {tomorrow_name}: {historical_avg}/10

Predict tomorrow's energy level and give preparation advice.

Rules:
- predicted_energy: float between 1.0 and 10.0
- confidence: "high" if strong pattern, "medium" if moderate, "low" if insufficient
- weather_label: exactly one of: Stormy | Cloudy | Partly Sunny | Sunny | Radiant
- reasoning: 2 sentences explaining WHY — reference specific patterns and numbers
- advice: 2 sentences of specific actionable preparation for tomorrow
- villain_warning: if a villain theme is likely tomorrow warn gently — empty string if none

STRICT RULES:
- Be specific — reference actual days and numbers
- Never be generic
- advice must be concrete not vague
"""

    response = structured_llm.invoke(prompt)

    # save to DB
    db = SessionLocal()
    try:
        forecast = EnergyForecast(
            user_id          = user_id,
            forecast_day     = tomorrow_name,
            predicted_energy = response.predicted_energy,
            confidence       = response.confidence,
            advice           = response.advice,
            reasoning        = response.reasoning,
            created_at       = datetime.now()
        )
        db.add(forecast)
        db.commit()
    finally:
        db.close()

    return {
        "ready":            True,
        "tomorrow":         tomorrow_name,
        "predicted_energy": round(response.predicted_energy, 1),
        "weather_label":    response.weather_label,
        "confidence":       response.confidence,
        "reasoning":        response.reasoning,
        "advice":           response.advice,
        "villain_warning":  response.villain_warning
    }

# ─────────────────────────────────────────────
# Feature 3 — Energy Villain Detection
# ─────────────────────────────────────────────
def generate_energy_villain(user_id: int, stage: str = "mature_user") -> dict:
    # ── skip for insufficient data ────────────────────────
    if stage in ('anonymous', 'first_entry'):
        return {"ready": False, "message": "Not enough data yet"}
    # ── existing logic unchanged below ───────────────────
    data = fetch_energy_data(user_id, days_back=30)

    if not data["has_enough_data"]:
        return {
            "ready":   False,
            "message": "Write more entries to detect your Energy Villain"
        }

    if not data["villain_themes"]:
        return {
            "ready":         True,
            "villain_found": False,
            "message":       "No consistent energy villain detected yet — keep journaling"
        }

    structured_llm = llm.with_structured_output(VillainStructure)

    prompt = f"""
You are a behavioral pattern analyst.

This person's low energy days consistently feature these themes: {data['villain_themes']}
Their overall energy by day: {data['day_map']}
Recent 7-day trend: {data['recent_trend']}

Identify their single biggest energy villain — the theme, person, or situation
that most consistently appears before or during energy crashes.

Rules:
- villain_name: the specific thing draining their energy e.g. "back-to-back meetings", "your manager"
- energy_impact: estimated average energy drop in points when this villain appears
- pattern_summary: 2 sentences describing when and how it drains them
- advice: 2 sentences on how to protect their energy from this villain

STRICT RULES:
- Be specific — name the actual villain from their data
- energy_impact must be a realistic float e.g. 2.3
- Speak directly to the person using "you"
"""

    response = structured_llm.invoke(prompt)

    return {
        "ready":          True,
        "villain_found":  True,
        "villain_name":   response.villain_name,
        "energy_impact":  round(response.energy_impact, 1),
        "pattern_summary": response.pattern_summary,
        "advice":         response.advice
    }

# ─────────────────────────────────────────────
# Feature 4 — Golden Hours
# ─────────────────────────────────────────────
def generate_golden_hours(user_id: int, stage: str = "mature_user") -> dict:
    # ── skip for insufficient data ────────────────────────
    if stage in ('anonymous', 'first_entry'):
        return {"ready": False, "message": "Not enough data yet"}
    # ── existing logic unchanged below ───────────────────
    data = fetch_energy_data(user_id, days_back=60)

    if not data["has_enough_data"]:
        return {
            "ready":   False,
            "message": "Write more entries to discover your Golden Hours"
        }

    hour_map = data["hour_map"]
    if not hour_map:
        return {"ready": False, "message": "Not enough time-stamped entries yet"}

    # find top 3 peak hours
    sorted_hours = sorted(hour_map.items(), key=lambda x: x[1], reverse=True)
    top_hours    = sorted_hours[:3]
    low_hours    = sorted_hours[-3:]

    # format windows
    def format_window(hour):
        end = (hour + 2) % 24
        return f"{hour:02d}:00–{end:02d}:00"

    peak_windows = [
        {"window": format_window(h), "avg_energy": round(e, 1)}
        for h, e in top_hours
    ]
    low_windows = [
        {"window": format_window(h), "avg_energy": round(e, 1)}
        for h, e in low_hours
    ]

    # determine time type
    peak_hour_num = top_hours[0][0] if top_hours else 12
    if peak_hour_num < 12:       time_type = "Morning person — your mind is sharpest before noon"
    elif peak_hour_num < 17:     time_type = "Afternoon thinker — you build momentum through the day"
    else:                        time_type = "Night thinker — your best work happens when the world goes quiet"

    return {
        "ready":        True,
        "peak_windows": peak_windows,
        "low_windows":  low_windows,
        "time_type":    time_type,
        "best_hour":    format_window(peak_hour_num),
        "advice":       f"Schedule your most important deep work during {format_window(peak_hour_num)} — that is when your brain is running at full capacity based on {data['total_entries']} entries"
    }

# ─────────────────────────────────────────────
# Feature 5 — Energy Streak
# ─────────────────────────────────────────────
def generate_energy_streak(user_id: int, stage: str = "mature_user") -> dict:
    # ── skip for insufficient data ────────────────────────
    if stage in ('anonymous', 'first_entry'):
        return {"ready": False, "message": "Not enough data yet"}
    # ── existing logic unchanged below ───────────────────
    data    = fetch_energy_data(user_id, days_back=60)
    scores  = data["scores"]
    entries = data["all_entries"]

    if len(scores) < 3:
        return {
            "ready":   False,
            "message": "Write more entries to track your Energy Streak"
        }

    avg = sum(scores) / len(scores)

    # calculate current streak of above-average days
    current_streak = 0
    for e in reversed(entries):
        if e.energy_score and e.energy_score >= avg:
            current_streak += 1
        else:
            break

    # calculate longest streak ever
    longest_streak = 0
    temp_streak    = 0
    for e in entries:
        if e.energy_score and e.energy_score >= avg:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # current slump length
    current_slump = 0
    for e in reversed(entries):
        if e.energy_score and e.energy_score < avg:
            current_slump += 1
        else:
            break

    # determine status
    if current_streak >= 3:
        status  = "on_streak"
        message = f"You are on a {current_streak}-day high energy streak — your longest ever was {longest_streak} days. Something is working right now. Don't change it."
    elif current_slump >= 3:
        status  = "in_slump"
        message = f"You have had {current_slump} consecutive low energy days — that is longer than your usual recovery time of {data['recovery_speed']}. Something needs your attention."
    elif current_streak > 0:
        status  = "recovering"
        message = f"You are {current_streak} day into a recovery. Your average recovery takes {data['recovery_speed']} — you are right on track."
    else:
        status  = "neutral"
        message = "Your energy has been mixed recently. Consistency is your next goal."

    return {
        "ready":          True,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "current_slump":  current_slump,
        "streak_status":  status,
        "streak_message": message,
        "slump_alert":    current_slump >= 4,
        "personal_avg":   round(avg, 1)
    }

# ─────────────────────────────────────────────
# Master function — returns all 5 features at once
# ─────────────────────────────────────────────
def get_full_energy_tracker(user_id: int, stage: str = "mature_user") -> dict:
    data = fetch_energy_data(user_id)

    return {
        "dna":      generate_energy_dna(user_id, stage),
        "forecast": generate_energy_forecast(user_id, stage),
        "villain":  generate_energy_villain(user_id, stage),
        "golden":   generate_golden_hours(user_id, stage),
        "streak":   generate_energy_streak(user_id, stage),
        "summary": {
            "total_entries": data["total_entries"],
            "peak_day":      data["peak_day"],
            "low_day":       data["low_day"],
            "peak_hour":     data["peak_hour"],
            "consistency":   data["consistency"]
        }
    }