import json, sys, time, re, urllib.request, urllib.parse
UA={"User-Agent":"travel-guide-builder/1.0"}
items=json.load(open(sys.argv[1])); out={}
for key,title in items.items():
    for attempt in range(4):
        try:
            u="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","format":"json","titles":title,"prop":"imageinfo","iiprop":"url|extmetadata","iiurlwidth":960})
            d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20))
            p=list(d["query"]["pages"].values())[0]; ii=p["imageinfo"][0]; m=ii.get("extmetadata",{})
            art=re.sub("<[^>]+>","",m.get("Artist",{}).get("value","")).strip()[:50]
            lic=m.get("LicenseShortName",{}).get("value","")
            time.sleep(3)
            data=urllib.request.urlopen(urllib.request.Request(ii.get("thumburl") or ii["url"],headers=UA),timeout=40).read()
            open(f"img/{key}.raw","wb").write(data)
            out[key]={"title":title,"artist":art,"license":lic,"page":ii["descriptionurl"]}
            print("ok",key,lic,art,len(data)); break
        except Exception as e:
            print("retry",key,e); time.sleep(15)
    time.sleep(4)
json.dump(out,open("img/credits.json","w"),ensure_ascii=False,indent=1)
