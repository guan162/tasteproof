#!/usr/bin/env python3
"""Retrieve latest reported World Bank WDI values. Never fabricate missing data.
Outputs a GitHub Pages-readable snapshot with original per-indicator years.
No secrets are required. Source: https://api.worldbank.org/v2/
"""
from __future__ import annotations
import datetime as dt
import json
import pathlib
import time
import urllib.error
import urllib.request
from urllib.parse import quote

COUNTRIES = ["JP","KR","SG","MY","TH","VN","ID","PH","US","GB","AU","DE","FR","IN","CN","BR"]
INDICATORS = ["SP.POP.TOTL","IT.NET.USER.ZS","NY.GDP.PCAP.CD"]
ROOT = pathlib.Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "docs" / "data" / "market-data.json"
NOW = dt.datetime.now(dt.timezone.utc)
YEAR_MAX = NOW.year
YEAR_MIN = max(2017, YEAR_MAX - 10)
COUNTRY_PATH = ";".join(COUNTRIES)

def get_rows(indicator: str) -> list[dict]:
    url = ("https://api.worldbank.org/v2/country/" + COUNTRY_PATH
           + "/indicator/" + indicator
           + f"?format=json&date={YEAR_MIN}:{YEAR_MAX}&per_page=1000")
    request = urllib.request.Request(url, headers={"User-Agent":"TasteProof-MarketCheck/1.0 (public, CC-BY-4.0)", "Accept":"application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read(5_000_001)
            if len(raw)>5_000_000:
                raise RuntimeError("WDI payload exceeds 5MB")
            decoded=json.loads(raw)
            if not isinstance(decoded, list) or len(decoded)!=2 or not isinstance(decoded[1], list):
                raise RuntimeError("Unexpected WDI API response for "+indicator)
            if decoded[0].get("pages",1)!=1:
                raise RuntimeError("WDI response paginated unexpectedly")
            return decoded[1]
        except (urllib.error.URLError, TimeoutError, ValueError) as err:
            if attempt==2:
                raise RuntimeError("WDI fetch failed for "+indicator) from err
            time.sleep(attempt+1)

def build_snapshot(fetch=get_rows) -> dict:
    countries = {code:{} for code in COUNTRIES}
    nonempty = 0
    for indicator in INDICATORS:
        rows=fetch(indicator)
        for row in rows:
            if not isinstance(row,dict):
                continue
            code=(row.get("country") or {}).get("id")
            if code not in countries: continue
            if (row.get("indicator") or {}).get("id") != indicator: continue
            value=row.get("value")
            try: year=int(row.get("date",""))
            except (TypeError, ValueError): continue
            if isinstance(value, bool) or not isinstance(value,(int,float)) or not (YEAR_MIN<=year<=YEAR_MAX):
                continue
            if (indicator=="SP.POP.TOTL" and value<0) or (indicator=="IT.NET.USER.ZS" and not 0<=value<=100):
                continue
            current=countries[code].get(indicator)
            if current is None or year>current["year"]:
                countries[code][indicator]={"value":value,"year":year}
                nonempty += (current is None)
    if nonempty < len(COUNTRIES)*2:
        raise RuntimeError("Too few values; do not publish incomplete replacement data")
    return {
      "source":"World Bank WDI",
      "license":"World Bank WDI, CC BY 4.0; original providers may vary by indicator",
      "fetched_at":NOW.isoformat(timespec="seconds"),
      "indicators":INDICATORS,
      "countries":countries,
      "method":"Latest available per-country per-indicator year within the last 10 calendar years. Never interpolated."
    }

def main():
    snapshot=build_snapshot()
    DESTINATION.parent.mkdir(parents=True,exist_ok=True)
    DESTINATION.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(f"World Bank WDI snapshot updated: {len(snapshot['countries'])} countries.")

if __name__=="__main__":
    main()
