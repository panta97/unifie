from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import PosSessionV2Snapshot
from .otp_decorators import require_otp_session
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_otp_session
@require_http_methods(["GET"])
def get_session_snapshots(request, session_id):
    """
    GET endpoint to retrieve snapshot history for a POS session.
    Returns list of snapshots with metadata ordered by creation time (newest first).
    """
    try:
        snapshots = PosSessionV2Snapshot.objects.filter(
            original_session_id=session_id
        ).order_by("-snapshot_created_at").values(
            "id",
            "snapshot_created_at",
            "pos_name",
            "status",
            "cashier__first_name",
            "cashier__last_name",
            "manager__first_name",
            "manager__last_name",
        )

        snapshot_list = []
        for idx, snapshot in enumerate(snapshots, start=1):
            snapshot_list.append({
                "id": snapshot["id"],
                "version": len(snapshots) - idx + 1,  # Calculate version number
                "snapshot_created_at": snapshot["snapshot_created_at"],
                "pos_name": snapshot["pos_name"],
                "status": snapshot["status"],
                "cashier": f"{snapshot['cashier__first_name']} {snapshot['cashier__last_name']}" if snapshot['cashier__first_name'] else None,
                "manager": f"{snapshot['manager__first_name']} {snapshot['manager__last_name']}" if snapshot['manager__first_name'] else None,
            })

        logger.info(f"📋 Retrieved {len(snapshot_list)} snapshots for session {session_id}")
        
        return JsonResponse({
            "session_id": session_id,
            "snapshot_count": len(snapshot_list),
            "snapshots": snapshot_list,
        })

    except Exception as e:
        logger.error(f"❌ Error retrieving snapshots for session {session_id}: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)
