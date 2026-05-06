import pandas as pd
try:
    df = pd.read_excel(r"C:\Users\NILE\Downloads\P.7.S-students-20260506.xlsx")
    print("Columns:", df.columns.tolist())
    print("First row:", df.iloc[0].to_dict())
except Exception as e:
    print("Error:", str(e))
