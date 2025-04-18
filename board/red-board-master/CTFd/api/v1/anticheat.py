from flask_restx import Namespace, Resource
import datetime

from CTFd.api.v1.helpers.request import validate_args
from CTFd.models import db, Challenges, AnticheatFlags, Flags
from CTFd.utils.decorators import admins_only
from CTFd.utils.mutation.mutator import mutate

anticheat_namespace = Namespace("anticheat", description="Endpoint to get mutated flags")

@anticheat_namespace.route("")
class Anticheat(Resource):
    @validate_args(
        {
            "user_hash": (str, None),          
            "task_key": (str, None),          
        },
        location="query",
    )
    def get(self, query_args):
        try:
            taskToken = query_args.pop("task_key", None) 
        except:
            return {"error": "Incorrect task token"}
        challenge = Challenges.query.filter_by(challenge_token = taskToken).first_or_404()
        try:
            user_hash = query_args.pop("user_hash", None)
            mutationNymber = int(user_hash, 16)
        except:
            return {"error": "Incorrect user's hash"}
        
        issued_flags = AnticheatFlags.query.filter_by(user_hash = user_hash, task_id = challenge.id).all()
        flag_content = Flags.query.filter_by(challenge_id = challenge.id, type = "online_mutated").first_or_404()
        flag = mutate(flag_content.content, mutationNymber)
        if not issued_flags:
            mutated_flag = AnticheatFlags(
                content = flag,
                generation_time = datetime.datetime.now(),
                solve_time = None,
                task_id = challenge.id,
                user_hash = user_hash,
                user_id = None,
            )

            db.session.add(mutated_flag)
            db.session.commit()
            db.session.close()
            
        return flag

@anticheat_namespace.route("/<challenge_id>")
class AnticheatChalFlags(Resource):
    @admins_only
    @anticheat_namespace.doc(
        description="Endpoint to delete mutated flags",
        responses={200: ("Success", "APISimpleSuccessResponse")},
    )
    def delete(self, challenge_id):
        AnticheatFlags.query.filter_by(task_id = challenge_id).delete()
        db.session.commit()
        db.session.close()
        return {"success": True}   

