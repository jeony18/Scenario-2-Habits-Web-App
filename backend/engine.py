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
    """Context-aware bonus/penalty based on weather and time of day."""
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
    """
    Returns a score indicating how well a requirement matches the user's current energy.
    
    IMPROVEMENT: Exponential penalty instead of linear. 
    Previously `5 - abs(a - b)`. Now we square the difference to heavily penalize
    activities that are nowhere near the user's current mood.
    Max difference is 4 (1 vs 5), 4^2 = 16.
    By doing 16 - (diff^2) it scales: 
    Diff 0 -> Score 16
    Diff 1 -> Score 15
    Diff 2 -> Score 12
    Diff 3 -> Score 7
    Diff 4 -> Score 0
    This ensures extreme mismatches (like high energy workout when exhausted) are rarely picked.
    """
    diff = abs(a - b)
    # Using 16 as the base since max possible difference (5 - 1) squared is 16.
    return 16 - (diff ** 2)


def score_activity(activity, physical_energy, social_battery, recent_logs=None, context=None):
    """
    Calculates the final suitability score for an activity.
    
    IMPROVEMENT: Added `recent_logs` to incorporate Recency Bias.
    If the activity ID is found in the recently completed logs (e.g. from the last 18 hours), 
    we drastically reduce its score so the user gets varied recommendations instead of the same thing.
    """
    if recent_logs is None:
        recent_logs = set()
        
    base_score = (
        W_E * match(activity["physicality"], physical_energy)
        + W_B * match(activity["sociability"], social_battery)
        + W_I * activity["importance"]
    )

    base_score += context_adjustment(activity, context)
    
    # Apply a heavy recency penalty if the user already just did this!
    if activity["id"] in recent_logs:
        base_score -= 100  # ensures it drops to the bottom of the list 
        
    return base_score


def hard_filter(activities, available_time):
    """
    Filters out activities that take too long.
    
    IMPROVEMENT: Added a +1 buffer to the filter threshold. 
    If a user has 30 minutes (slot 2), but an activity is 60 minutes (slot 3), 
    it might still show up. Sometimes users are willing to stretch their time 
    slightly if the activity is the perfect match for their mood. 
    (Note: This relies on the 1-5 slot scaling, so +1 slot means allowing the next tier up).
    """
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
    """
    Recommends a "wildcard" activity slightly outside the user's comfort zone.
    
    IMPROVEMENT: Smarter attribute boosting. 
    Instead of blindly adding +1 or +2 (which could break the 1-5 scale or ask too much of an exhausted user),
    it checks where the user currently is. If they are very low energy (1), it gently suggests a 2.
    If they are very high energy (5), it suggests a 4 to cool down.
    """
    candidates = [a for a in activities if a["id"] not in excluded_ids]
    if not candidates:
        candidates = list(activities)
    if not candidates:
        return None

    boost_attr = random.choice(["physicality", "sociability"])
    
    # Smart scale adjustment: Gently nudge up if low, gently pull down if maxed out
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
    """
    Main recommendation engine hook.
    """
    if recent_logs is None:
        recent_logs = set()
        
    filtered = hard_filter(activities, available_time)
    
    # We pass the recent logs into top_k to enforce recency bias
    deterministic = top_k(filtered, physical_energy, social_battery, recent_logs, context)
    
    excluded_ids = {a["id"] for a in deterministic}
    
    # We also pass recent logs into leap so our wildcard isn't something we just did either
    leap = take_the_leap(filtered, physical_energy, social_battery, excluded_ids, recent_logs, context)
    
    return {
        "deterministic": deterministic,
        "take_the_leap": leap,
        "filtered_count": len(filtered),
    }