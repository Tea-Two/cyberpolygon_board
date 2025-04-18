from flask import render_template, request, url_for

from CTFd.admin import admin
from CTFd.models import LogSubmission
from CTFd.utils.decorators import admins_only
from CTFd.utils.modes import get_model

@admin.route("/admin/logsubmission")
@admins_only
def logsubmission_listing():
    filters = []

    q = request.args.get("q")
    field = request.args.get("field")
    page = abs(request.args.get("page", 1, type=int))

    if q:
        logsubmission = []
        if LogSubmission.__mapper__.has_property(
            field
        ):  # The field exists as an exposed column
            filters.append(getattr(LogSubmission, field).like("%{}%".format(q)))
    
    Model = get_model()

    logsubmission = (
        LogSubmission.query.add_columns(
            LogSubmission.id,
            LogSubmission.time_delta,
            LogSubmission.team,
            LogSubmission.challenge,
            LogSubmission.ip_open,
            LogSubmission.date_open,
            LogSubmission.user_open,
            LogSubmission.ip_submit,
            LogSubmission.date_submit,
            LogSubmission.user_submit,
        )
        .filter(*filters)
        .filter(LogSubmission.time_delta!=None)
        .order_by(LogSubmission.time_delta)
        .paginate(page=page, per_page=50)
    )

    args = dict(request.args)
    args.pop("page", 1)

    return render_template(
        "admin/logsubmission.html",
        logsubmission=logsubmission,
        prev_page=url_for(
            request.endpoint,
            page=logsubmission.prev_num,
            **args
        ),
        next_page=url_for(
            request.endpoint,
            page=logsubmission.next_num,
            **args
        ),
        q=q,
        field=field,
    )