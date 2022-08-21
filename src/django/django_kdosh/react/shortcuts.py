import re
import requests

from django.conf import settings
from django.shortcuts import render


# Create your views here.
def render_react_app(request, app_name):
    try:
        # fd = open(f"./static/manifest.json", "r")
        url = f"https://{settings.ALLOWED_HOSTS[0]}/static/manifest.json"
        resp = requests.get(url=url)
        manifest = resp.json()
    except Exception as e:
        raise Exception(
            f"{url}"
            f"{e}"
        )

    context = {
        "test" : "Roosevelt"
    }

    for key in manifest:
        if re.match(r"web\/" + app_name + r"\/\w+\.(jsx|tsx)", key):
            context["js_filename"] = manifest[key]["file"]
            context["css_filename"] = manifest[key]["css"][0]


    return render(request, 'react/index.html', context)
