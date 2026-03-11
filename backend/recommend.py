import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from data import ACTIVITIES
from engine import recommend


def prompt_int(label, lo=1, hi=5):
    while True:
        try:
            value = int(input(f"{label} ({lo}–{hi}): "))
            if lo <= value <= hi:
                return value
            print(f"  Please enter a number between {lo} and {hi}.")
        except ValueError:
            print("  Invalid input. Please enter a whole number.")


def display_activity(activity, label):
    print(f"\n  [{label}]")
    print(f"  Name        : {activity['name']}")
    print(f"  Duration    : {activity['duration']}/5")
    print(f"  Physicality : {activity['physicality']}/5")
    print(f"  Sociability : {activity['sociability']}/5")
    print(f"  Importance  : {activity['importance']}/5")
    print(f"  Description : {activity['description']}")


def main():
    print("=" * 50)
    print("   Habits App — Activity Recommender")
    print("=" * 50)
    print("\nRate your current state (1 = low, 5 = high):\n")

    available_time    = prompt_int("Available time (slots)")
    physical_energy   = prompt_int("Physical energy")
    social_battery    = prompt_int("Social battery")

    results = recommend(ACTIVITIES, available_time, physical_energy, social_battery)

    print(f"\n{results['filtered_count']} activities match your available time.\n")

    if not results["deterministic"] and results["take_the_leap"] is None:
        print("No activities found for your current inputs. Try increasing available time.")
        return

    print("-" * 50)
    print("Your Top Recommendations:")
    for i, activity in enumerate(results["deterministic"], start=1):
        display_activity(activity, f"Recommendation {i}")

    print("\n" + "-" * 50)
    print("Take the Leap:")
    if results["take_the_leap"]:
        display_activity(results["take_the_leap"], "Something different")
    else:
        print("  Not enough activities to suggest a leap option.")

    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
