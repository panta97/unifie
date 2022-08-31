from .shortcuts import render_react_app
from django.contrib.auth.decorators import login_required

@login_required
def barcode_view(request):
    return render_react_app(request, 'barcode', 'Barcode')


@login_required
def purchase_order_sheet_view(request):
    return render_react_app(request, 'purchase_order_sheet', 'Purchase Order')


@login_required
def k_sales_view(request):
    return render_react_app(request, 'k_sales', 'Sales')
