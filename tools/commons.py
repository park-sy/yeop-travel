import json, sys, urllib.request, urllib.parse
q = sys.argv[1]
u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
 "action":"query","format":"json","generator":"search","gsrsearch":q+" filetype:bitmap","gsrnamespace":6,"gsrlimit":6,
 "prop":"imageinfo","iiprop":"url|extmetadata|size","iiurlwidth":900})
req = urllib.request.Request(u, headers={"User-Agent":"travel-guide-builder/1.0"})
d = json.load(urllib.request.urlopen(req, timeout=20))
for p in sorted(d.get("query",{}).get("pages",{}).values(), key=lambda x:x.get("index",0)):
    ii = p["imageinfo"][0]; m = ii.get("extmetadata",{})
    lic = m.get("LicenseShortName",{}).get("value",""); art = m.get("Artist",{}).get("value","")
    import re; art = re.sub("<[^>]+>","",art)[:40]
    print(f'{p["title"][:70]} | {ii["width"]}x{ii["height"]} | {lic} | {art} | {ii.get("thumburl")}')
