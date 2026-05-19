import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("data/external/zenodo_ssaqs/extracted")
OUT_DIR = Path("data/processed")
OUT_CSV = OUT_DIR / "zenodo_ssaqs_daily_brainboost.csv"
OUT_META = OUT_DIR / "zenodo_ssaqs_etl_summary.json"


def parse_datetime(value):
  if value is None or value == "":
    return None
  text = str(value).strip()
  try:
    if text.isdigit():
      return datetime.fromtimestamp(int(text), tz=timezone.utc)
    return datetime.fromisoformat(text.replace("Z", "+00:00"))
  except ValueError:
    return None


def date_key(value):
  parsed = parse_datetime(value)
  return parsed.date().isoformat() if parsed else None


def safe_float(value):
  try:
    if value is None or value == "":
      return None
    return float(value)
  except ValueError:
    return None


def read_csv(path):
  if not path.exists():
    return []
  with path.open(newline="", encoding="utf-8-sig") as handle:
    return list(csv.DictReader(handle))


def mean(values):
  clean = [v for v in values if v is not None]
  return round(sum(clean) / len(clean), 3) if clean else None


def load_users_courses():
  path = ROOT / "users-courses.csv"
  users = {}
  for row in read_csv(path):
    users[row["userid"]] = {
      "university": row.get("university"),
      "course": row.get("course"),
    }
  return users


def to_sleep_band(score):
  if score is None:
    return None
  if score >= 85:
    return "8"
  if score >= 75:
    return "7"
  if score >= 65:
    return "6"
  return "< 6"


def to_screen_band(stress_score, anxiety_score):
  # SSAQS has no screen-time measure. This proxy is only for BrainBoost mapping
  # examples: high stress/anxiety suggests a higher-risk reminder context.
  stress = stress_score or 0
  anxiety = anxiety_score or 0
  risk = max(stress, anxiety)
  if risk >= 80:
    return "8h+"
  if risk >= 60:
    return "6-8h"
  if risk >= 40:
    return "4-6h"
  return "2-4h"


def aggregate_user(user_dir, user_meta):
  user_id = user_dir.name
  daily = defaultdict(lambda: {
    "userid": user_id,
    "university": user_meta.get("university"),
    "course": user_meta.get("course"),
    "date": None,
    "sleep_overall_scores": [],
    "deep_sleep_minutes": [],
    "steps_total": 0,
    "steps_records": 0,
    "activity_levels": Counter(),
    "hrv_rmssd": [],
    "oxygen_values": [],
    "fitbit_stress_scores": [],
    "question_stress": [],
    "question_anxiety": [],
  })

  for row in read_csv(user_dir / "sleep.csv"):
    day = date_key(row.get("timestamp"))
    if not day:
      continue
    daily[day]["date"] = day
    daily[day]["sleep_overall_scores"].append(safe_float(row.get("overall_score")))
    daily[day]["deep_sleep_minutes"].append(safe_float(row.get("deep_sleep_in_minutes")))

  for row in read_csv(user_dir / "steps.csv"):
    day = date_key(row.get("timestamp"))
    if not day:
      continue
    daily[day]["date"] = day
    steps = safe_float(row.get("steps")) or 0
    daily[day]["steps_total"] += steps
    daily[day]["steps_records"] += 1

  for row in read_csv(user_dir / "activity_level.csv"):
    day = date_key(row.get("timestamp"))
    if not day:
      continue
    daily[day]["date"] = day
    daily[day]["activity_levels"][row.get("level") or "UNKNOWN"] += 1

  for row in read_csv(user_dir / "hrv.csv"):
    day = date_key(row.get("timestamp"))
    if not day:
      continue
    daily[day]["date"] = day
    daily[day]["hrv_rmssd"].append(safe_float(row.get("rmssd")))

  for row in read_csv(user_dir / "oxygen.csv"):
    day = date_key(row.get("timestamp"))
    if not day:
      continue
    daily[day]["date"] = day
    daily[day]["oxygen_values"].append(safe_float(row.get("value")))

  for row in read_csv(user_dir / "stress.csv"):
    day = date_key(row.get("DATE"))
    if not day:
      continue
    daily[day]["date"] = day
    failed = str(row.get("CALCULATION_FAILED", "")).lower() == "true"
    if not failed:
      daily[day]["fitbit_stress_scores"].append(safe_float(row.get("STRESS_SCORE")))

  for row in read_csv(user_dir / "daily_questions.csv"):
    day = date_key(row.get("timeStampStart") or row.get("timeStampSent") or row.get("timeStampScheduled"))
    if not day:
      continue
    daily[day]["date"] = day
    daily[day]["question_stress"].append(safe_float(row.get("stress")))
    daily[day]["question_anxiety"].append(safe_float(row.get("anxiety")))

  output_rows = []
  for day, values in sorted(daily.items()):
    activity_total = sum(values["activity_levels"].values())
    lightly = values["activity_levels"].get("LIGHTLY_ACTIVE", 0)
    fairly = values["activity_levels"].get("FAIRLY_ACTIVE", 0)
    very = values["activity_levels"].get("VERY_ACTIVE", 0)
    active_minutes = lightly + fairly + very
    sedentary_minutes = values["activity_levels"].get("SEDENTARY", 0)

    sleep_score = mean(values["sleep_overall_scores"])
    avg_stress = mean(values["question_stress"])
    avg_anxiety = mean(values["question_anxiety"])
    physical_activity = values["steps_total"] >= 5000 or active_minutes >= 30

    output_rows.append({
      "userid": values["userid"],
      "university": values["university"],
      "course": values["course"],
      "date": values["date"] or day,
      "sleep_overall_score": sleep_score,
      "deep_sleep_minutes": mean(values["deep_sleep_minutes"]),
      "steps_total": int(values["steps_total"]),
      "active_minutes": int(active_minutes),
      "sedentary_minutes": int(sedentary_minutes),
      "activity_records": int(activity_total),
      "avg_hrv_rmssd": mean(values["hrv_rmssd"]),
      "avg_oxygen": mean(values["oxygen_values"]),
      "fitbit_stress_score": mean(values["fitbit_stress_scores"]),
      "self_report_stress": avg_stress,
      "self_report_anxiety": avg_anxiety,
      "brainboost_sleep_hours_band": to_sleep_band(sleep_score),
      "brainboost_screen_time_proxy": to_screen_band(avg_stress, avg_anxiety),
      "brainboost_physical_activity": physical_activity,
      "smart_reminder_candidate": (
        (sleep_score is not None and sleep_score < 70)
        or (avg_stress is not None and avg_stress >= 60)
        or (avg_anxiety is not None and avg_anxiety >= 60)
        or not physical_activity
      ),
    })
  return output_rows


def main():
  if not ROOT.exists():
    raise SystemExit(f"Dataset folder not found: {ROOT}")

  OUT_DIR.mkdir(parents=True, exist_ok=True)
  users = load_users_courses()
  rows = []
  participant_dirs = [p for p in ROOT.iterdir() if p.is_dir() and p.name.isdigit()]

  for user_dir in sorted(participant_dirs, key=lambda p: int(p.name)):
    rows.extend(aggregate_user(user_dir, users.get(user_dir.name, {})))

  fieldnames = [
    "userid",
    "university",
    "course",
    "date",
    "sleep_overall_score",
    "deep_sleep_minutes",
    "steps_total",
    "active_minutes",
    "sedentary_minutes",
    "activity_records",
    "avg_hrv_rmssd",
    "avg_oxygen",
    "fitbit_stress_score",
    "self_report_stress",
    "self_report_anxiety",
    "brainboost_sleep_hours_band",
    "brainboost_screen_time_proxy",
    "brainboost_physical_activity",
    "smart_reminder_candidate",
  ]
  with OUT_CSV.open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

  summary = {
    "source": "Zenodo record 18706837 - SSAQS dataset",
    "participants_found": len(participant_dirs),
    "daily_rows_written": len(rows),
    "output_csv": str(OUT_CSV),
    "columns": fieldnames,
  }
  OUT_META.write_text(json.dumps(summary, indent=2), encoding="utf-8")
  print(json.dumps(summary, indent=2))


if __name__ == "__main__":
  main()
