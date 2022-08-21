from .shortcuts import render_react_app



# Create your views here.
def barcode_view(request):
    return render_react_app(request, 'barcode')

def purchase_order_sheet_view(request):
    return render_react_app(request, 'purchase_order_sheet')

def k_sales_view(request):
    return render_react_app(request, 'k_sales')
