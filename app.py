"""TasteProof public demo. Fictional data only; no Qloo API calls."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CITIES = {
    "Tokyo": ["minimalism", "craft coffee", "ceramics", "design"],
    "Taipei": ["tea", "night markets", "craft coffee", "design"],
    "Seoul": ["skincare", "fashion", "design", "cafes"],
    "London": ["music", "independent cafes", "fashion", "design"],
    "New York": ["music", "design", "craft coffee", "streetwear"],
    "Paris": ["fashion", "ceramics", "independent cafes", "design"],
}

def compare(a, b):
    if a not in CITIES or b not in CITIES or a == b:
        raise ValueError("Select two distinct supported cities")
    x, y = set(CITIES[a]), set(CITIES[b])
    return {"from": a, "to": b, "shared": sorted(x & y),
            "only_from": sorted(x-y), "only_to": sorted(y-x),
            "difference_index": round(1-len(x&y)/len(x|y),3),
            "source": "fictional demonstration data",
            "warning": "Not real Qloo research; index is not a sales forecast."}

PAGE = """<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TasteProof — prototype</title><style>
body{font:16px system-ui;max-width:760px;margin:6vh auto;padding:16px;background:#f7f8fb;color:#172033}
main{padding:28px;background:white;border-radius:18px;box-shadow:0 8px 30px #14213d13}
select,button{padding:12px;border-radius:9px;margin:8px;border:1px solid #aebaca}
button{background:#243b7b;color:white;cursor:pointer}pre{white-space:pre-wrap;background:#f0f3f8;padding:16px;border-radius:12px}
small{color:#9a321b}h1{font-size:2rem}</style><main>
<h1>TasteProof</h1><p>Cross-cultural blindspot detector — offline demonstration</p>
<small>FICTIONAL DEMO DATA. No live Qloo data, financial projections, or commercial recommendations.</small>
<p><label>Baseline <select id="a"></select></label>
<label>Target <select id="b"></select></label></p>
<button onclick="go()">Compare markets</button><pre id="out">Choose two cities.</pre>
<script>
const cities=['Tokyo','Taipei','Seoul','London','New York','Paris'];
for(const id of ['a','b']){const s=document.getElementById(id);cities.forEach(c=>s.add(new Option(c,c)))}
document.getElementById('b').value='Taipei';
async function go(){const a=document.getElementById('a').value,b=document.getElementById('b').value;
const r=await fetch('/api/compare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({a,b})});
document.getElementById('out').textContent=JSON.stringify(await r.json(),null,2)}
</script></main></html>"""

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, obj, mime="application/json; charset=utf-8"):
        data = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'")
        self.end_headers()
        self.wfile.write(data)
    def do_GET(self):
        if self.path == "/":
            return self.reply(200,PAGE.encode(),"text/html; charset=utf-8")
        if self.path == "/api/health":
            return self.reply(200,{"status":"ok","source":"fictional demo"})
        return self.reply(404,{"error":"Not found"})
    def do_POST(self):
        if self.path != "/api/compare":
            return self.reply(404,{"error":"Not found"})
        try:
            size=int(self.headers.get("Content-Length","0"))
            if size < 1 or size > 2048: return self.reply(413,{"error":"Invalid request length"})
            inp=json.loads(self.rfile.read(size))
            return self.reply(200, compare(inp.get("a"),inp.get("b")))
        except (ValueError,AttributeError,TypeError) as e:
            return self.reply(400,{"error":str(e)})

if __name__=="__main__":
    host=os.getenv("HOST","127.0.0.1")
    port=int(os.getenv("PORT","8000"))
    print(f"TasteProof demo on http://{host}:{port}")
    ThreadingHTTPServer((host,port),Handler).serve_forever()
