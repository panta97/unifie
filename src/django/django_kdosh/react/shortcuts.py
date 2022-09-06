import re
import requests

from django.conf import settings
from django.shortcuts import render


# Create your views here.
def render_react_app(request, app_name, display_name):
    try:
        if settings.DEVELOPMENT_MODE or settings.DEVELOPMENT_MODE == 'True':
            url = f"http://{settings.ALLOWED_HOSTS[0]}:8000/static/manifest.json"
        else:
            url = f"https://{settings.ALLOWED_HOSTS[0]}/static/manifest.json"
        resp = requests.get(url=url)
        manifest = resp.json()
    except Exception as e:
        raise Exception(
            f"{url}"
            f"{e}"
        )

    context = {
        "display_name" : display_name
    }

    for key in manifest:
        if re.match(r"web\/" + app_name + r"\/\w+\.(jsx|tsx)", key):
            context["js_filename"] = manifest[key]["file"]
            context["css_filename"] = manifest[key]["css"][0]


    return render(request, 'react/index.html', context)
