import pandas as pd


# -----------------------
# LOAD DATA
# -----------------------

df = pd.read_csv(
    "data/events.csv"
)

print("Loaded:")
print(df.shape)



# -----------------------
# DATETIME FIX
# -----------------------

df["start_datetime"] = pd.to_datetime(
    df["start_datetime"],
    format="mixed",
    errors="coerce"
)


df["end_datetime"] = pd.to_datetime(
    df["end_datetime"],
    format="mixed",
    errors="coerce"
)


df = df.dropna(
    subset=[
        "start_datetime",
        "end_datetime"
    ]
)



# -----------------------
# DURATION
# -----------------------

df["duration"] = (
    df["end_datetime"]
    -
    df["start_datetime"]
).dt.total_seconds()/60


df = df[df["duration"] >= 0]



# -----------------------
# TIME FEATURES
# -----------------------

df["hour"] = (
    df["start_datetime"]
    .dt.hour
)


df["day"] = (
    df["start_datetime"]
    .dt.dayofweek
)


df["peak_hour"] = (
    df["hour"]
    .apply(
        lambda x:
        1 if x in [8,9,10,17,18,19,20]
        else 0
    )
)



# -----------------------
# ROAD CLOSURE
# -----------------------

df["closure_score"] = (

    df["requires_road_closure"]
    .astype(str)
    .str.lower()
    .map(
        {
            "yes":1,
            "true":1,
            "1":1,
            "no":0,
            "false":0,
            "0":0
        }
    )
    .fillna(0)

)



# -----------------------
# PRIORITY
# -----------------------

df["priority_score"] = (

    df["priority"]
    .astype(str)
    .str.lower()
    .map(
        {
            "high":3,
            "medium":2,
            "low":1
        }
    )
    .fillna(1)

)



# -----------------------
# LOCATION FREQUENCY
# -----------------------

zone_counts = (
    df["zone"]
    .value_counts()
)


df["zone_frequency"] = (
    df["zone"]
    .map(zone_counts)
)



# -----------------------
# IMPACT SCORE
# -----------------------

df["impact_score"] = (

    df["duration"]
    .clip(0,300)
    /300*30

    +

    df["closure_score"]*30

    +

    df["priority_score"]
    /3*20

    +

    df["peak_hour"]*10

    +

    df["zone_frequency"]
    /
    df["zone_frequency"].max()
    *10
)



df["impact_score"] = (
    df["impact_score"]
    .clip(0,100)
)



# -----------------------
# LABEL
# -----------------------

def risk(x):

    if x < 30:
        return "LOW"

    elif x < 70:
        return "MEDIUM"

    else:
        return "HIGH"



df["risk"] = (
    df["impact_score"]
    .apply(risk)
)



# -----------------------
# SAVE
# -----------------------

df.to_csv(
    "data/processed_events.csv",
    index=False
)



print("\nFinished")
print(
    df["risk"].value_counts()
)

print(
    df.head()
)