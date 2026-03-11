import random

W_E = 0.5   # physicality match weight
W_B = 0.5   # sociability match weight
W_I = 0.15  # importance weight
TOP_K = 2


def match(a, b):
    """Returns 1–5; higher means closer match."""
    return 5 - abs(a - b)


def score_activity(activity, physical_energy, social_battery):
    return (
        W_E * match(activity["physicality"], physical_energy)
        + W_B * match(activity["sociability"], social_battery)
        + W_I * activity["importance"]
    )


def hard_filter(activities, available_time):
    return [a for a in activities if a["duration"] <= available_time]


def top_k(activities, physical_energy, social_battery, k=TOP_K):
    scored = sorted(
        activities,
        key=lambda a: score_activity(a, physical_energy, social_battery),
        reverse=True,
    )
    return scored[:k]


def take_the_leap(activities, physical_energy, social_battery, excluded_ids):
    candidates = [a for a in activities if a["id"] not in excluded_ids]
    if not candidates:
        candidates = list(activities)
    if not candidates:
        return None

    boost_attr = random.choice(["physicality", "sociability"])
    boost_amount = random.randint(1, 2)

    if boost_attr == "physicality":
        boosted_energy = min(5, physical_energy + boost_amount)
        boosted_battery = social_battery
    else:
        boosted_energy = physical_energy
        boosted_battery = min(5, social_battery + boost_amount)

    return max(
        candidates,
        key=lambda a: score_activity(a, boosted_energy, boosted_battery),
    )


def recommend(activities, available_time, physical_energy, social_battery):
    filtered = hard_filter(activities, available_time)
    deterministic = top_k(filtered, physical_energy, social_battery)
    excluded_ids = {a["id"] for a in deterministic}
    leap = take_the_leap(filtered, physical_energy, social_battery, excluded_ids)
    return {
        "deterministic": deterministic,
        "take_the_leap": leap,
        "filtered_count": len(filtered),
    }
