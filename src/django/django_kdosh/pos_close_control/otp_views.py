import json
import logging
import pyotp
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Employee, OTPSession

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def verify_otp(request):
    """
    POST /api/pos-close-control/otp/verify
    Body: { employee_id, otp_code }
    Validates OTP and creates a new session token.
    """
    try:
        data = json.loads(request.body)
        employee_id = data.get("employee_id")
        otp_code = data.get("otp_code")

        if not employee_id or not otp_code:
            return JsonResponse(
                {"error": "employee_id and otp_code are required"}, status=400
            )

        # Find manager with TOTP configured
        employee = Employee.objects.filter(
            id=employee_id, type=Employee.MANAGER, is_used=True
        ).first()

        if not employee:
            return JsonResponse(
                {"error": "Employee not found or not a manager"}, status=404
            )

        if not employee.totp_secret:
            return JsonResponse(
                {"error": "TOTP not configured for this employee"}, status=400
            )

        # Verify OTP
        totp = pyotp.TOTP(employee.totp_secret)
        if not totp.verify(otp_code):
            return JsonResponse({"error": "Invalid OTP code"}, status=401)

        # Deactivate existing active sessions for this employee
        OTPSession.objects.filter(employee=employee, is_active=True).update(
            is_active=False
        )

        # Create new session
        session = OTPSession.objects.create(employee=employee)

        logger.info(f"OTP verified for employee {employee.id}, session {session.token}")

        return JsonResponse({
            "token": str(session.token),
            "employee": {
                "id": employee.id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
            },
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Error in verify_otp: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def validate_session(request):
    """
    POST /api/pos-close-control/otp/validate
    Header: X-OTP-Token
    Checks if the session token is valid and not expired.
    """
    try:
        token = request.headers.get("X-OTP-Token")

        if not token:
            return JsonResponse({"valid": False, "reason": "No token provided"})

        session = OTPSession.objects.filter(token=token, is_active=True).first()

        if not session:
            return JsonResponse({"valid": False, "reason": "Session not found"})

        if session.is_expired():
            session.is_active = False
            session.save(update_fields=["is_active"])
            return JsonResponse({"valid": False, "reason": "Session expired"})

        # Refresh activity
        session.refresh()

        return JsonResponse({
            "valid": True,
            "employee": {
                "id": session.employee.id,
                "first_name": session.employee.first_name,
                "last_name": session.employee.last_name,
            },
        })

    except Exception as e:
        logger.error(f"Error in validate_session: {str(e)}")
        return JsonResponse({"valid": False, "reason": str(e)})
