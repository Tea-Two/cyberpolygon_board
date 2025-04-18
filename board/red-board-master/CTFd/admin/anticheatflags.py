from flask import render_template, request, url_for

from CTFd.admin import admin
from CTFd.models import db, AnticheatFlags, Challenges
from CTFd.utils.decorators import admins_only


@admin.route("/admin/anticheatflags")
@admins_only
def anticheatflags_viewer():
    q = request.args.get("q")
    field = request.args.get("field")
    filters = []

    page = abs(request.args.get("page", 1, type=int))
    if q:
        # The field exists as an exposed column
        if AnticheatFlags.__mapper__.has_property(field):
            filters.append(getattr(AnticheatFlags, field).like("%{}%".format(q)))
        elif Challenges.__mapper__.has_property(field):
            filters.append(getattr(Challenges, field).like("%{}%".format(q)))

    query = db.session.query(AnticheatFlags, Challenges)
    query = query.outerjoin(Challenges, Challenges.id == AnticheatFlags.task_id)
    query = query.filter(*filters).order_by(AnticheatFlags.id.asc())
    flags = query.paginate(page=page, per_page=100)
    fl = query.all()
    for f in fl:
        print(f)
    total = query.count()
    args = dict(request.args)
    args.pop("page", 1)
    return render_template(
        "admin/anticheatflags.html", 
        flags = flags,
        total=total,
        q=q,
        field=field,
        prev_page=url_for(
            request.endpoint,
            page=flags.prev_num,
            **args
        ),
        next_page=url_for(
            request.endpoint,
            page=flags.next_num,
            **args
        ),
    )

