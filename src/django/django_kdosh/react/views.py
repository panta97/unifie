import re
import os
import json
import requests

from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
def index(request):

    app_name = "default"

    try:

        # fd = open(f"./static/manifest.json", "r")
        url = f"https://{settings.DJANGO_ALLOWED_HOSTS}/static/manifest.json"
        resp = requests.get(url=url)
        manifest = json.load(resp)
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
