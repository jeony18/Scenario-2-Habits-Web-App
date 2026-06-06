import random

W_E = 0.5   # physicality match weight
W_B = 0.5   # sociability match weight
W_I = 0.15  # importance weight
TOP_K = 2

OUTDOOR_KEYWORDS = {
    "jog", "run", "cycling", "bike", "hike", "walk", "climbing", "snorkel", "park", "court", "outdoor"
}

BAD_WEATHER = {"rain", "snow", "storm"}


def is_outdoor_activity(activity):
    text = f"{activity.get('name', '')} {activity.get('description', '')}".lower()
    return any(keyword in text for keyword in OUTDOOR_KEYWORDS)


def context_adjustment(activity, context=None):
    if not context:
        return 0

    adjustment = 0
    weather = str(context.get("weather", "unknown")).lower()
    hour = context.get("hour")
    is_weekend = bool(context.get("isWeekend", False))

    if weather in BAD_WEATHER and is_outdoor_activity(activity):
        adjustment -= 6
    elif weather == "clear" and is_outdoor_activity(activity):
        adjustment += 1

    if isinstance(hour, int):
        if hour >= 21 or hour < 6:
            if activity["physicality"] >= 4:
                adjustment -= 4
            if activity["sociability"] >= 4:
                adjustment -= 2
        elif 6 <= hour <= 9 and activity["duration"] <= 2:
            adjustment += 1

    if is_weekend and activity["sociability"] >= 4:
        adjustment += 1.5

    return adjustment

def match(a, b):
    diff = abs(a - b)
    return 16 - (diff ** 2)


def score_activity(activity, physical_energy, social_battery, recent_logs=None, context=None):
    if recent_logs is None:
        recent_logs = set()
        
    base_score = (
        W_E * match(activity["physicality"], physical_energy)
        + W_B * match(activity["sociability"], social_battery)
        + W_I * activity["importance"]
    )

    base_score += context_adjustment(activity, context)

    if activity["id"] in recent_logs:
        base_score -= 100

    return base_score


def hard_filter(activities, available_time):
    buffer_tolerance = available_time + 1
    return [a for a in activities if a["duration"] <= buffer_tolerance]


def top_k(activities, physical_energy, social_battery, recent_logs, context=None, k=TOP_K):
    scored = sorted(
        activities,
        key=lambda a: score_activity(a, physical_energy, social_battery, recent_logs, context),
        reverse=True,
    )
    return scored[:k]


def take_the_leap(activities, physical_energy, social_battery, excluded_ids, recent_logs, context=None):
    candidates = [a for a in activities if a["id"] not in excluded_ids]
    if not candidates:
        candidates = list(activities)
    if not candidates:
        return None

    boost_attr = random.choice(["physicality", "sociability"])

    if boost_attr == "physicality":
        boosted_energy = physical_energy + 1 if physical_energy < 5 else physical_energy - 1
        boosted_battery = social_battery
    else:
        boosted_energy = physical_energy
        boosted_battery = social_battery + 1 if social_battery < 5 else social_battery - 1

    return max(
        candidates,
        key=lambda a: score_activity(a, boosted_energy, boosted_battery, recent_logs, context),
    )


def recommend(activities, available_time, physical_energy, social_battery, recent_logs=None, context=None):
    if recent_logs is None:
        recent_logs = set()
        
    filtered = hard_filter(activities, available_time)

    deterministic = top_k(filtered, physical_energy, social_battery, recent_logs, context)

    excluded_ids = {a["id"] for a in deterministic}

    leap = take_the_leap(filtered, physical_energy, social_battery, excluded_ids, recent_logs, context)
    
    return {
        "deterministic": deterministic,
        "take_the_leap": leap,
        "filtered_count": len(filtered),
    }