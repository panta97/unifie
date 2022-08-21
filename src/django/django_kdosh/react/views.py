import re
import os
import json

from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
def index(request):

    app_name = "default"

    try:
        fd = open(f"./static/manifest.json", "r")
        manifest = json.load(fd)
    except:
        raise Exception(
            f"Vite manifest file not found or invalid. Maybe your/dist/manifest.json file is empty?"
        )

    context = {
        "test" : "Roosevelt"
    }

    for key in manifest:
        if re.match(r"web\/" + app_name + r"\/\w+\.(jsx|tsx)", key):
            context["js_filename"] = manifest[key]["file"]
            context["css_filename"] = manifest[key]["css"][0]


    return render(request, 'react/index.html', context)
