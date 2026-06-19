import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report

from sklearn.ensemble import RandomForestClassifier



# =====================
# LOAD DATA
# =====================

df = pd.read_csv(
    "../data/processed_events.csv"
)



# =====================
# REMOVE POSSIBLE LEAKAGE
# =====================

# priority is often generated from impact/risk
# remove it if it was not manually collected

if "priority" in df.columns:
    df = df.drop(
        columns=["priority"]
    )



# =====================
# FEATURES AVAILABLE AT PREDICTION TIME
# =====================

features = [

    "event_type",

    "event_cause",

    "zone",

    "requires_road_closure",

    "duration",

    "hour",

    "day",

    "peak_hour"

]


X = df[features].copy()

y = df["risk"]



# =====================
# SPLIT FIRST
# =====================

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42,

    stratify=y

)



# =====================
# SAFE ZONE FREQUENCY
# =====================

train_zone_count = (
    X_train["zone"]
    .value_counts()
)



X_train["zone_frequency"] = (
    X_train["zone"]
    .map(train_zone_count)
)



X_test["zone_frequency"] = (
    X_test["zone"]
    .map(train_zone_count)
    .fillna(0)
)



# add engineered features AFTER split

for data in [X_train, X_test]:

    data["duration_risk"] = (
        data["duration"]
        *
        data["peak_hour"]
    )


    data["closure_duration"] = (
        data["requires_road_closure"]
        *
        data["duration"]
    )



features += [

    "zone_frequency",

    "duration_risk",

    "closure_duration"

]



X_train = X_train[features]

X_test = X_test[features]



cat_cols = [

    "event_type",

    "event_cause",

    "zone",

    "requires_road_closure"

]



num_cols = [

    "duration",

    "hour",

    "day",

    "peak_hour",

    "zone_frequency",

    "duration_risk",

    "closure_duration"

]



# =====================
# PREPROCESSOR
# =====================


preprocessor = ColumnTransformer(

    [

        (
            "num",

            Pipeline(
                [
                    (
                        "imputer",
                        SimpleImputer(
                            strategy="median"
                        )
                    ),

                    (
                        "scale",
                        StandardScaler()
                    )

                ]
            ),

            num_cols

        ),



        (
            "cat",

            Pipeline(
                [

                    (
                        "imputer",
                        SimpleImputer(
                            strategy="most_frequent"
                        )
                    ),

                    (
                        "encoder",
                        OneHotEncoder(
                            handle_unknown="ignore"
                        )
                    )

                ]
            ),

            cat_cols

        )

    ]

)



# =====================
# MODEL
# =====================


rf = RandomForestClassifier(

    random_state=42,

    n_jobs=-1

)



pipeline = Pipeline(

    [

        (
            "preprocessor",
            preprocessor
        ),

        (
            "classifier",
            rf
        )

    ]

)



params = {


"classifier__n_estimators":

[
300,
500,
700
],


"classifier__max_depth":

[
8,
12,
18,
None
],


"classifier__min_samples_split":

[
2,
5
],


"classifier__min_samples_leaf":

[
1,
2
]


}



search = GridSearchCV(

    pipeline,

    params,

    cv=5,

    scoring="accuracy",

    n_jobs=-1,

    verbose=1

)



search.fit(

    X_train,

    y_train

)



model = search.best_estimator_



# =====================
# TEST
# =====================


pred = model.predict(
    X_test
)



accuracy = accuracy_score(

    y_test,

    pred

)



print("===================")

print(
    "Best Params:",
    search.best_params_
)


print(
    "Accuracy:",
    round(
        accuracy*100,
        2
    ),
    "%"
)


print(
    classification_report(
        y_test,
        pred
    )
)



# =====================
# SAVE
# =====================


os.makedirs(
    "model",
    exist_ok=True
)


joblib.dump(

    model,

    "model/congestion_model_clean.pkl"

)


print(
    "Saved clean model"
)