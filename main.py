# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# FRA claimant data
fra_claimant = {
    "Name": "Ramesh",
    "Father": "Sothan",
    "Village": "Kaltapally",
    "District": "Adilabad",
    "State": "Telangana",
    "Patta": "PAT-000123",
    "Survey": "45/2",
    "Coordinates": "19.6354 N, 18.5371 E",
    "Land Area (hectares)": 2.5,
    "Claim Status": "Granted",
    "SC": False,
    "ST": True,
    "Other Vulnerable": False,
    "Income Level": "Low",
    "Water Index": 0.25,
    "Gender": "Male",
    "Age": 35,
    "Village Population": 600,
    "Village ST Percentage": 60,
    "Aspirational District": True,
    "Village ST Population": 360,
    "Unelectrified HH": True,
    "Health Facility Distance Km": 6,
    "Terrain": "Hilly",
    "No Pucca House": True,
    "No Toilet": True,
    "Pregnant or Lactating": False,
    "Children 0-6": 2,
    "Student": True,
    "Youth/SHG/VDVK": True,
    "Fisherman/CFR Holder": True,
    "Livestock Interest": True,
    "PRI Member/Official": True,
    "Homestay Interest": True,
    "SCD Affected": True
}

# DSS function
def fra_dss(claimant):
    schemes = []
    
    # FRA Rights
    if claimant["Claim Status"] == "Granted":
        schemes.append("Individual Forest Rights - Title to forest land under occupation (up to 4 ha)")
        if claimant["ST"]:
            schemes.append("Community Forest Rights - Nistar, grazing, MFP collection, habitat for PTGs")
        if claimant["Village ST Percentage"] >= 50 or (claimant["Aspirational District"] and claimant["Village ST Population"] >= 50):
            schemes.append("Community Forest Resource Rights - Management and conservation authority")

    # Core CSS Schemes
    if claimant["Claim Status"] == "Granted":
        schemes.append("National Social Assistance Programme (NSAP)")
        schemes.append("Mahatma Gandhi National Rural Employment Guarantee Programme (MGNREGA)")
        if claimant["SC"]:
            schemes.append("Umbrella Scheme for Development of Scheduled Castes")
        if claimant["ST"]:
            schemes.append("Umbrella Programme for Development of Scheduled Tribes")
        if claimant["Other Vulnerable"]:
            schemes.append("Umbrella Programme for Development of Other Vulnerable Groups")

    # DAJGUA
    if (claimant["Village Population"] >= 500 and claimant["Village ST Percentage"] >= 50) or (claimant["Aspirational District"] and claimant["Village ST Population"] >= 50):
        schemes.append("Village Eligible for DAJGUA Interventions")
        if claimant["ST"]:
            if claimant["No Pucca House"]:
                schemes.append("Priority: PMAY-G for low-income ST HH")
            if claimant["Water Index"] < 0.3:
                schemes.append("Priority: JJM due to low water index")
            if claimant["Unelectrified HH"]:
                schemes.append("Eligible: House Electrification under RDSS")
    
    # Other CSS Schemes
    if claimant["Land Area (hectares)"] <= 2.5 and claimant["Claim Status"] == "Granted":
        schemes.append("Pradhan Mantri Krishi Sinchai Yojana (Micro-irrigation)")
        schemes.append("PM Kisan Samman Nidhi (Income Support)")

    if claimant["Water Index"] < 0.3:
        schemes.append("Priority: Jal Jeevan Mission / Borewell schemes (low water index)")

    if claimant["Income Level"] == "Low" or claimant["No Pucca House"] or claimant["No Toilet"]:
        schemes.append("PM Awas Yojana – PMAY (Rural Housing Assistance)")
        schemes.append("Swachh Bharat Mission – SBM Rural/Urban (Sanitation)")

    return schemes

# Endpoint
@app.get("/eligible-schemes")
def get_schemes():
    return {
        "claimant": {
            "name": fra_claimant["Name"],
            "father": fra_claimant["Father"],
            "village": fra_claimant["Village"],
            "district": fra_claimant["District"],
            "state": fra_claimant["State"],
            "landArea": fra_claimant["Land Area (hectares)"],
            "claimStatus": fra_claimant["Claim Status"],
        },
        "eligible_schemes": fra_dss(fra_claimant)
    }
