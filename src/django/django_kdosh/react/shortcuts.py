import re
import requests

from django.conf import settings
from django.shortcuts import render


# Create your views here.
def render_react_app(request, app_name, display_name, hide_in_print_mode=True):
    context = {
        "display_name": display_name,
        "hide_in_print_mode": hide_in_print_mode,
        "DEV": settings.DEVELOPMENT_MODE,
    }

    if settings.DEVELOPMENT_MODE:
        context["js_filename"] = app_name
    else:
        url = f"https://{settings.ALLOWED_HOSTS[0]}/react-static/manifest.json"
        resp = requests.get(url=url)
        manifest = resp.json()
        for key in manifest:
            if re.match(r"web\/" + app_name + r"\/index\.tsx", key):
                context["js_filename"] = manifest[key]["file"]
                context["css_filename"] = manifest[key]["css"][0]

    return render(request, "react/index.html", context)
