import functools
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from .models import OTPSession


def require_otp_session(view_func):
    """
    Decorator for function-based views that requires a valid OTP session.
    Reads X-OTP-Token header, validates the session, and refreshes activity.
    """

    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = request.headers.get("X-OTP-Token")

        if not token:
            return JsonResponse(
                {"error": "OTP authentication required", "otp_required": True},
                status=401,
            )

        session = OTPSession.objects.filter(token=token, is_active=True).first()

        if not session:
            return JsonResponse(
                {"error": "Invalid OTP session", "otp_required": True},
                status=401,
            )

        if session.is_expired():
            session.is_active = False
            session.save(update_fields=["is_active"])
            return JsonResponse(
                {"error": "OTP session expired", "otp_required": True},
                status=401,
            )

        # Refresh activity timestamp
        session.refresh()

        # Attach session info to request
        request.otp_session = session
        request.otp_employee = session.employee

        return view_func(request, *args, **kwargs)

    return wrapper


class OTPSessionMixin:
    """
    Mixin for class-based views that requires a valid OTP session.
    Applies require_otp_session to dispatch().
    """

    @method_decorator(require_otp_session)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
